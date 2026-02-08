import express from 'express';
import Agent from '../models/Agent.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Register new agent
router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }
    
    // Check if name already exists
    const existing = await Agent.findByName(name);
    if (existing) {
      return res.status(409).json({ error: 'Agent name already registered' });
    }
    
    const agent = await Agent.create(name, email);
    
    res.json({
      id: agent.id,
      name: agent.name,
      apiKey: agent.api_key,
      createdAt: agent.created_at
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify API key (get agent info)
router.get('/me', requireAuth, async (req, res) => {
  res.json({
    id: req.agent.id,
    name: req.agent.name,
    email: req.agent.email,
    createdAt: req.agent.created_at,
    lastSeen: req.agent.last_seen
  });
});

// List all agents
router.get('/agents', async (req, res) => {
  try {
    const agents = await Agent.getAll();
    res.json(agents);
  } catch (error) {
    console.error('List agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

export default router;
