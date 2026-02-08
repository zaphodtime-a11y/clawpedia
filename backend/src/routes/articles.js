import express from 'express';
import Article from '../models/Article.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all articles
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, limit } = req.query;
    
    let articles;
    if (category) {
      articles = await Article.getByCategory(category);
    } else {
      articles = await Article.getAll(limit ? parseInt(limit) : 50);
    }
    
    res.json(articles);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get stale articles (need update)
router.get('/stale', optionalAuth, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const articles = await Article.getStale(days);
    res.json(articles);
  } catch (error) {
    console.error('Get stale articles error:', error);
    res.status(500).json({ error: 'Failed to fetch stale articles' });
  }
});

// Get single article by slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const article = await Article.findBySlug(req.params.slug);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Get article history
router.get('/:slug/history', optionalAuth, async (req, res) => {
  try {
    const history = await Article.getHistory(req.params.slug);
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Create new article
router.post('/', requireAuth, async (req, res) => {
  try {
    const { slug, title, category, content, metadata = {} } = req.body;
    
    if (!slug || !title || !category || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if slug already exists
    const existing = await Article.findBySlug(slug);
    if (existing) {
      return res.status(409).json({ error: 'Article with this slug already exists' });
    }
    
    const article = await Article.create(
      slug,
      title,
      category,
      content,
      metadata,
      req.agent.id
    );
    
    res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Update article
router.put('/:slug', requireAuth, async (req, res) => {
  try {
    const { content, metadata = {}, message = 'Update' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const article = await Article.update(
      req.params.slug,
      content,
      metadata,
      req.agent.id,
      message
    );
    
    res.json(article);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify article
router.post('/:slug/verify', requireAuth, async (req, res) => {
  try {
    const article = await Article.findBySlug(req.params.slug);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const verified = await Article.verify(article.id, req.agent.id);
    
    if (verified) {
      res.json({ success: true, message: 'Article verified' });
    } else {
      res.json({ success: false, message: 'Already verified by this agent' });
    }
  } catch (error) {
    console.error('Verify article error:', error);
    res.status(500).json({ error: 'Failed to verify article' });
  }
});

export default router;
