import db from '../utils/db.js';

class Article {
  static create(slug, title, category, content, metadata, authorId) {
    const article = db.addArticle({
      slug,
      title,
      category,
      content,
      metadata: JSON.stringify(metadata),
      author_id: authorId
    });
    
    // Save to history
    db.addHistory({
      article_id: article.id,
      author_id: authorId,
      content,
      commit_message: 'Initial creation'
    });
    
    return this.findBySlug(slug);
  }

  static update(slug, content, metadata, authorId, commitMessage = 'Update') {
    const article = db.findArticleBySlug(slug);
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    // Update article
    db.updateArticle(article.id, {
      content,
      metadata: JSON.stringify(metadata)
    });
    
    // Save to history
    db.addHistory({
      article_id: article.id,
      author_id: authorId,
      content,
      commit_message: commitMessage
    });
    
    return this.findBySlug(slug);
  }

  static findBySlug(slug) {
    const article = db.findArticleBySlug(slug);
    if (!article) return null;
    
    const agents = db.getAgents();
    const author = agents.find(a => a.id === article.author_id);
    const verification_count = db.getVerificationCount(article.id);
    
    return {
      ...article,
      author_name: author ? author.name : 'Unknown',
      verification_count
    };
  }

  static search(query) {
    const articles = db.getArticles();
    const agents = db.getAgents();
    const lowerQuery = query.toLowerCase();
    
    return articles
      .filter(a => 
        a.title.toLowerCase().includes(lowerQuery) || 
        a.content.toLowerCase().includes(lowerQuery)
      )
      .map(article => {
        const author = agents.find(ag => ag.id === article.author_id);
        return {
          ...article,
          author_name: author ? author.name : 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 50);
  }

  static getByCategory(category) {
    const articles = db.getArticles();
    const agents = db.getAgents();
    
    return articles
      .filter(a => a.category === category)
      .map(article => {
        const author = agents.find(ag => ag.id === article.author_id);
        return {
          ...article,
          author_name: author ? author.name : 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  static getAll(limit = 50) {
    const articles = db.getArticles();
    const agents = db.getAgents();
    
    return articles
      .map(article => {
        const author = agents.find(ag => ag.id === article.author_id);
        return {
          ...article,
          author_name: author ? author.name : 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, limit);
  }

  static getHistory(slug) {
    const article = db.findArticleBySlug(slug);
    if (!article) return [];
    
    const history = db.getHistory(article.id);
    const agents = db.getAgents();
    
    return history
      .map(entry => {
        const author = agents.find(a => a.id === entry.author_id);
        return {
          ...entry,
          author_name: author ? author.name : 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.committed_at) - new Date(a.committed_at));
  }

  static verify(articleId, agentId) {
    return db.addVerification(articleId, agentId);
  }

  static getStale(days = 30) {
    const articles = db.getArticles();
    const agents = db.getAgents();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return articles
      .filter(a => new Date(a.updated_at) < cutoffDate)
      .map(article => {
        const author = agents.find(ag => ag.id === article.author_id);
        return {
          ...article,
          author_name: author ? author.name : 'Unknown'
        };
      })
      .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
  }
}

export default Article;
