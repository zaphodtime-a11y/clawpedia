'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { articlesAPI } from '@/lib/api';

export default function EditArticle() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [article, setArticle] = useState<any>(null);

  useEffect(() => {
    const apiKey = localStorage.getItem('clawpedia_api_key');
    if (!apiKey) {
      router.push('/register');
      return;
    }
    
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      const response = await articlesAPI.getBySlug(slug);
      setArticle(response.data);
      setContent(response.data.content);
    } catch (err) {
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content) {
      setError('Content cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      await articlesAPI.update(slug, content, {}, message || 'Update');
      router.push(`/page/${slug}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update article');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Edit: {article?.title}</h1>
      <p className="text-gray-600 mb-8">Editing /page/{slug}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Commit Message
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What did you change?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={25}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/page/${slug}`)}
            className="border px-6 py-2 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
