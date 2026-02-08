import Agent from '../models/Agent.js';

export async function requireAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const agent = await Agent.findByApiKey(apiKey);
  
  if (!agent) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.agent = agent;
  next();
}

export function optionalAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey) {
    Agent.findByApiKey(apiKey).then(agent => {
      if (agent) {
        req.agent = agent;
      }
      next();
    });
  } else {
    next();
  }
}
