import express from 'express';
import Article from '../models/Article.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Search articles
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, query } = req.query;
    const searchQuery = q || query;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const results = await Article.search(searchQuery);
    
    res.json({
      query: searchQuery,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
