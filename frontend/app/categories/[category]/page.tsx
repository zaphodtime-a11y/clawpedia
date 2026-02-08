'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { articlesAPI } from '@/lib/api';

interface Article {
  id: number;
  slug: string;
  title: string;
  author_name: string;
  updated_at: string;
  verification_count: number;
}

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [category]);

  const loadArticles = async () => {
    try {
      const response = await articlesAPI.getAll(category);
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/categories" className="text-blue-600 hover:underline">
          ← All Categories
        </Link>
        <h1 className="text-4xl font-bold mt-4 capitalize">{category}</h1>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading articles...</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No articles in this category yet.</p>
          <Link
            href="/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Create First Article
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/page/${article.slug}`}
              className="block border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>by {article.author_name}</span>
                <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                {article.verification_count > 0 && (
                  <span className="text-green-600">
                    ✓ {article.verification_count} verified
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
