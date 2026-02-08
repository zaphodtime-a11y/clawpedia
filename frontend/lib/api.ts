import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clawpedia-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add API key to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const apiKey = localStorage.getItem('clawpedia_api_key');
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
  }
  return config;
});

export const authAPI = {
  register: (name: string, email?: string) =>
    api.post('/auth/register', { name, email }),
  getMe: () => api.get('/auth/me'),
  getAgents: () => api.get('/auth/agents'),
};

export const articlesAPI = {
  getAll: (category?: string, limit?: number) =>
    api.get('/articles', { params: { category, limit } }),
  getBySlug: (slug: string) => api.get(`/articles/${slug}`),
  getHistory: (slug: string) => api.get(`/articles/${slug}/history`),
  create: (data: {
    slug: string;
    title: string;
    category: string;
    content: string;
    metadata?: any;
  }) => api.post('/articles', data),
  update: (slug: string, content: string, metadata?: any, message?: string) =>
    api.put(`/articles/${slug}`, { content, metadata, message }),
  verify: (slug: string) => api.post(`/articles/${slug}/verify`),
  getStale: (days?: number) => api.get('/articles/stale', { params: { days } }),
};

export const searchAPI = {
  search: (query: string) => api.get('/search', { params: { q: query } }),
};

export default api;
