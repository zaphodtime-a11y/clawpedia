import axios from 'axios';
import dotenv from 'dotenv';
import { messages } from './messages.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';
const AGENTPEDIA_API = process.env.AGENTPEDIA_URL || 'http://localhost:3001/api';
const STATE_FILE = path.join(process.cwd(), 'bot-state.json');

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { pendingResponses: {}, karma: {} };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Check for responses to bot comments
async function checkResponses() {
  console.log('🔍 Checking for responses to bot comments...\n');
  
  const state = loadState();
  const pending = state.pendingResponses || {};
  const pendingIds = Object.keys(pending);
  
  if (!pendingIds.length) {
    console.log('No pending responses to check.');
    return;
  }
  
  console.log(`Found ${pendingIds.length} posts with pending responses.\n`);
  
  for (const postId of pendingIds) {
    const info = pending[postId];
    
    // Get comments on this post
    try {
      const response = await axios.get(`${MOLTBOOK_API}/posts/${postId}/comments`);
      const comments = response.data.comments || [];
      
      // Find replies to our comment
      const ourComment = comments.find(c => c.id === info.commentId);
      if (!ourComment) continue;
      
      // Check for author replies
      const authorReplies = comments.filter(c => 
        c.author.name === info.postAuthor &&
        new Date(c.created_at) > new Date(info.commentedAt)
      );
      
      if (authorReplies.length > 0) {
        const reply = authorReplies[0];
        const text = reply.text.toLowerCase();
        
        console.log(`💬 Response from ${info.postAuthor} on "${info.postTitle}":`);
        console.log(`   "${reply.text}"\n`);
        
        // Parse response
        if (text.includes('yes') || text.includes('sure') || text.includes('okay') || text.includes('ok')) {
          console.log('✓ Author said YES! Creating article...\n');
          await createArticle(postId, info);
        } else if (text.includes('no') || text.includes('not interested') || text.includes('nah')) {
          console.log('✓ Author declined. Respecting their choice.\n');
          await replyToComment(info.commentId, messages.respectNo());
          delete pending[postId];
        } else {
          console.log('❓ Unclear response. Might need manual review.\n');
        }
      }
    } catch (error) {
      console.error(`Error checking post ${postId}:`, error.message);
    }
  }
  
  saveState(state);
  console.log('\n✓ Response check complete.');
}

// Create Clawpedia article from post
async function createArticle(postId, info) {
  try {
    // Get full post content
    const postResponse = await axios.get(`${MOLTBOOK_API}/posts/${postId}`);
    const post = postResponse.data;
    
    // Detect category
    const category = detectCategory(post);
    
    // Generate slug
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Create article
    const articleResponse = await axios.post(
      `${AGENTPEDIA_API}/articles`,
      {
        slug,
        title: post.title,
        category,
        content: post.content,
        metadata: {
          source: `https://moltbook.com/post/${postId}`,
          original_author: info.postAuthor,
          imported_at: new Date().toISOString()
        }
      },
      {
        headers: {
          'X-API-Key': process.env.AGENTPEDIA_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const article = articleResponse.data;
    const articleUrl = `http://clawpedia.dev/page/${article.slug}`;
    
    console.log(`✓ Article created: ${articleUrl}\n`);
    
    // Award karma
    const karma = 50;
    const state = loadState();
    if (!state.karma) state.karma = {};
    state.karma[info.postAuthor] = (state.karma[info.postAuthor] || 0) + karma;
    
    // Reply with success message
    await replyToComment(info.commentId, messages.success(articleUrl, karma));
    
    // Mark as complete
    const pending = state.pendingResponses || {};
    delete pending[postId];
    
    saveState(state);
    
    console.log(`💰 Karma awarded: ${info.postAuthor} +${karma} (total: ${state.karma[info.postAuthor]})`);
    
  } catch (error) {
    console.error('Error creating article:', error.response?.data || error.message);
  }
}

// Reply to a comment
async function replyToComment(commentId, text) {
  try {
    await axios.post(
      `${MOLTBOOK_API}/comments/${commentId}/reply`,
      { text },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MOLTBOOK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error replying to comment:', error.message);
  }
}

// Detect article category from content
function detectCategory(post) {
  const content = (post.title + ' ' + post.content).toLowerCase();
  
  if (content.match(/setup|install|configure|how to/)) return 'procedures';
  if (content.match(/pattern|architecture|system|design/)) return 'architecture';
  if (content.match(/cli|tool|command|api/)) return 'tools';
  if (content.match(/found|tested|observed|result/)) return 'observations';
  if (content.match(/what is|concept|theory|definition/)) return 'concepts';
  
  return 'procedures'; // Default
}

// Show karma leaderboard
function showKarmaLeaderboard() {
  const state = loadState();
  const karma = state.karma || {};
  
  const sorted = Object.entries(karma)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('\n🏆 Karma Leaderboard:\n');
  sorted.forEach(([agent, points], i) => {
    console.log(`${i + 1}. ${agent}: ${points} karma`);
  });
  console.log('');
}

// Main
if (process.argv.includes('--leaderboard')) {
  showKarmaLeaderboard();
} else {
  checkResponses().catch(console.error);
}
