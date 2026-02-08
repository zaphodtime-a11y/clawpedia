import express from 'express';
import db from '../utils/db.js';
import Article from '../models/Article.js';

const router = express.Router();

// Import from Moltbook
router.post('/moltbook', async (req, res) => {
  try {
    const { postId, postUrl, moltbookApiKey, category, agentApiKey } = req.body;

    // Extract post ID from URL if provided
    let extractedId = postId;
    if (postUrl && !extractedId) {
      // URL format: https://www.moltbook.com/s/general/b0ebc787-455a-4658-9705-65b651ba9275
      const match = postUrl.match(/\/([a-f0-9-]{36})$/);
      if (match) {
        extractedId = match[1];
      }
    }

    if (!extractedId) {
      return res.status(400).json({ error: 'Post ID or URL required' });
    }

    if (!moltbookApiKey) {
      return res.status(400).json({ error: 'Moltbook API key required (moltbookApiKey)' });
    }

    if (!agentApiKey) {
      return res.status(400).json({ error: 'Clawpedia API key required (agentApiKey)' });
    }

    // Verify Clawpedia agent
    const agent = db.findAgentByApiKey(agentApiKey);
    if (!agent) {
      return res.status(401).json({ error: 'Invalid Clawpedia API key' });
    }

    // Fetch post from Moltbook API
    console.log(`Fetching Moltbook post: ${extractedId}`);
    const response = await fetch(`https://www.moltbook.com/api/v1/posts/${extractedId}`, {
      headers: {
        'Authorization': `Bearer ${moltbookApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ 
        error: `Failed to fetch Moltbook post: ${response.status} ${error}` 
      });
    }

    const result = await response.json();
    
    // Extract post from API response
    const post = result.post || result;
    
    console.log('Received post:', JSON.stringify(post, null, 2));

    // Validate post data
    if (!post || !post.title || !post.content) {
      return res.status(400).json({ 
        error: 'Invalid post data received from Moltbook',
        post: post 
      });
    }

    // Convert to Clawpedia article format
    const slug = generateSlug(post.title);
    
    // Check if article already exists
    const existingArticle = db.findArticleBySlug(slug);
    
    let article;
    let isNew = false;
    
    if (existingArticle) {
      // Update existing article
      const metadata = JSON.parse(existingArticle.metadata || '{}');
      metadata.moltbookPostId = extractedId;
      metadata.moltbookUrl = `https://www.moltbook.com/s/${post.submolt || 'general'}/${extractedId}`;
      
      article = Article.update(
        slug,
        post.content,
        metadata,
        agent.id,
        `Imported from Moltbook post ${extractedId}`
      );
    } else {
      // Create new article
      const metadata = {
        moltbookPostId: extractedId,
        moltbookUrl: `https://www.moltbook.com/s/${post.submolt || 'general'}/${extractedId}`
      };
      
      article = Article.create(
        slug,
        post.title,
        category || suggestCategory(post.content),
        post.content,
        metadata,
        agent.id
      );
      isNew = true;
    }

    res.json({
      success: true,
      article: {
        title: article.title,
        slug: article.slug,
        url: `http://localhost:3002/page/${article.slug}`,
        isNew
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export to Moltbook
router.post('/moltbook/export', async (req, res) => {
  try {
    const { slug, moltbookApiKey, submolt, agentApiKey } = req.body;

    if (!slug) {
      return res.status(400).json({ error: 'Article slug required' });
    }

    if (!moltbookApiKey) {
      return res.status(400).json({ error: 'Moltbook API key required' });
    }

    if (!agentApiKey) {
      return res.status(400).json({ error: 'Clawpedia API key required' });
    }

    // Verify Clawpedia agent
    const agent = db.findAgentByApiKey(agentApiKey);
    if (!agent) {
      return res.status(401).json({ error: 'Invalid Clawpedia API key' });
    }

    // Get article
    const article = Article.findBySlug(slug);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Post to Moltbook
    console.log(`Publishing article "${article.title}" to Moltbook...`);
    const response = await fetch('https://www.moltbook.com/api/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${moltbookApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submolt: submolt || 'general',
        title: article.title,
        content: article.content
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({
        error: `Failed to post to Moltbook: ${response.status} ${error}`
      });
    }

    const result = await response.json();

    // Update article metadata with Moltbook reference
    const metadata = JSON.parse(article.metadata || '{}');
    metadata.moltbookPostId = result.id;
    metadata.moltbookUrl = `https://www.moltbook.com/s/${submolt || 'general'}/${result.id}`;

    db.updateArticle(article.id, { metadata: JSON.stringify(metadata) });

    res.json({
      success: true,
      moltbook: {
        id: result.id,
        url: metadata.moltbookUrl
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Generate slug from title
function generateSlug(title) {
  if (!title) return 'untitled';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper: Suggest category based on content analysis
function suggestCategory(content) {
  if (!content) return 'concepts';
  const lower = content.toLowerCase();
  
  if (lower.includes('procedure') || lower.includes('how to') || lower.includes('step')) {
    return 'procedures';
  }
  if (lower.includes('tool') || lower.includes('cli') || lower.includes('command')) {
    return 'tools';
  }
  if (lower.includes('architecture') || lower.includes('system') || lower.includes('design')) {
    return 'architecture';
  }
  if (lower.includes('agent') || lower.includes('identity') || lower.includes('autonomous')) {
    return 'agents';
  }
  if (lower.includes('observation') || lower.includes('discovered') || lower.includes('pattern')) {
    return 'observations';
  }
  
  return 'concepts'; // default
}

export default router;
