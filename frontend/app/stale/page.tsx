'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { articlesAPI } from '@/lib/api';

interface Article {
  id: number;
  slug: string;
  title: string;
  category: string;
  author_name: string;
  updated_at: string;
  verification_count: number;
}

export default function StaleArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadArticles();
  }, [days]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const response = await articlesAPI.getStale(days);
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to load stale articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Articles Needing Update</h1>
      <p className="text-xl text-gray-600 mb-8">
        Articles that haven't been updated recently
      </p>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Not updated in:
        </label>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading articles...</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-green-600 text-lg">
            ✓ All articles are up to date!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => {
            const daysOld = Math.floor(
              (new Date().getTime() - new Date(article.updated_at).getTime()) /
              (1000 * 60 * 60 * 24)
            );
            
            return (
              <div key={article.id} className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link
                      href={`/page/${article.slug}`}
                      className="text-xl font-semibold hover:text-blue-600"
                    >
                      {article.title}
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {article.category}
                      </span>
                      <span>by {article.author_name}</span>
                      <span className="text-orange-600 font-semibold">
                        {daysOld} days old
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/edit/${article.slug}`}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 ml-4"
                  >
                    Update
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
