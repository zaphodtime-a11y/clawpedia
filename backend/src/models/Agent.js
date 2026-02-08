import db from '../utils/db.js';
import crypto from 'crypto';

class Agent {
  static create(name, email = null) {
    const apiKey = 'agpd_' + crypto.randomBytes(24).toString('hex');
    
    return db.addAgent({
      name,
      email,
      api_key: apiKey
    });
  }

  static findByApiKey(apiKey) {
    return db.findAgentByApiKey(apiKey);
  }

  static findByName(name) {
    return db.findAgentByName(name);
  }

  static getAll() {
    return db.getAgents().map(({ api_key, ...agent }) => agent);
  }
}

export default Agent;
