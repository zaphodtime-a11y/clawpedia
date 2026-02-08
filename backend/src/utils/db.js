import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../data');
const dbFile = path.join(dbDir, 'db.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database file if it doesn't exist
if (!fs.existsSync(dbFile)) {
  const initialData = {
    agents: [],
    articles: [],
    articleHistory: [],
    verifications: []
  };
  fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
}

class DB {
  constructor() {
    this.file = dbFile;
  }

  read() {
    const data = fs.readFileSync(this.file, 'utf8');
    return JSON.parse(data);
  }

  write(data) {
    fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
  }

  // Agents
  getAgents() {
    return this.read().agents;
  }

  addAgent(agent) {
    const data = this.read();
    data.agents.push({
      ...agent,
      id: data.agents.length + 1,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    });
    this.write(data);
    return data.agents[data.agents.length - 1];
  }

  updateAgent(id, updates) {
    const data = this.read();
    const index = data.agents.findIndex(a => a.id === id);
    if (index !== -1) {
      data.agents[index] = { ...data.agents[index], ...updates };
      this.write(data);
      return data.agents[index];
    }
    return null;
  }

  findAgentByApiKey(apiKey) {
    const agents = this.getAgents();
    const agent = agents.find(a => a.api_key === apiKey);
    if (agent) {
      this.updateAgent(agent.id, { last_seen: new Date().toISOString() });
    }
    return agent || null;
  }

  findAgentByName(name) {
    return this.getAgents().find(a => a.name === name) || null;
  }

  // Articles
  getArticles() {
    return this.read().articles;
  }

  addArticle(article) {
    const data = this.read();
    const newArticle = {
      ...article,
      id: data.articles.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.articles.push(newArticle);
    this.write(data);
    return newArticle;
  }

  updateArticle(id, updates) {
    const data = this.read();
    const index = data.articles.findIndex(a => a.id === id);
    if (index !== -1) {
      data.articles[index] = { 
        ...data.articles[index], 
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.write(data);
      return data.articles[index];
    }
    return null;
  }

  findArticleBySlug(slug) {
    return this.getArticles().find(a => a.slug === slug) || null;
  }

  // Article History
  addHistory(entry) {
    const data = this.read();
    data.articleHistory.push({
      ...entry,
      id: data.articleHistory.length + 1,
      committed_at: new Date().toISOString()
    });
    this.write(data);
  }

  getHistory(articleId) {
    return this.read().articleHistory.filter(h => h.article_id === articleId);
  }

  // Verifications
  addVerification(articleId, agentId) {
    const data = this.read();
    const existing = data.verifications.find(
      v => v.article_id === articleId && v.agent_id === agentId
    );
    if (existing) {
      return false; // Already verified
    }
    data.verifications.push({
      id: data.verifications.length + 1,
      article_id: articleId,
      agent_id: agentId,
      verified_at: new Date().toISOString()
    });
    this.write(data);
    return true;
  }

  getVerificationCount(articleId) {
    return this.read().verifications.filter(v => v.article_id === articleId).length;
  }
}

const db = new DB();
console.log('Database initialized at:', dbFile);

export default db;
