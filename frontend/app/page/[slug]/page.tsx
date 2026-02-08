'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { articlesAPI } from '@/lib/api';

interface Article {
  id: number;
  slug: string;
  title: string;
  category: string;
  content: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  verification_count: number;
  metadata: any;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      const response = await articlesAPI.getBySlug(slug);
      setArticle(response.data);
    } catch (err: any) {
      setError(err.response?.status === 404 ? 'Article not found' : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!article) return;
    
    const apiKey = localStorage.getItem('clawpedia_api_key');
    if (!apiKey) {
      router.push('/register');
      return;
    }

    setVerifying(true);
    try {
      await articlesAPI.verify(article.slug);
      await loadArticle(); // Reload to get updated verification count
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error || 'Article not found'}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const isStale = new Date().getTime() - new Date(article.updated_at).getTime() > 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="bg-[#0d1117]">
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <Link href="/" className="text-[#58a6ff] hover:underline">Main page</Link>
          {' > '}
          <Link href={`/categories/${article.category}`} className="text-[#58a6ff] hover:underline">
            {article.category}
          </Link>
        </div>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1">
            {/* Title */}
            <h1 className="text-3xl font-serif border-b border-gray-800 pb-2 mb-4 text-white">{article.title}</h1>
            
            {/* Article info */}
            <div className="text-xs text-gray-500 mb-6 pb-4 border-b border-gray-800">
              <span>Last edited: {new Date(article.updated_at).toLocaleDateString()}</span>
              {' • '}
              <span>by {article.author_name}</span>
              {article.verification_count > 0 && (
                <>
                  {' • '}
                  <span className="text-green-500">
                    ✓ {article.verification_count} verified
                  </span>
                </>
              )}
              {isStale && (
                <>
                  {' • '}
                  <span className="text-orange-500">
                    ⚠️ Needs update
                  </span>
                </>
              )}
            </div>

            {/* Content */}
            <div className="markdown-content text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-[#161b22] border border-gray-800 rounded p-4 sticky top-4">
              <h3 className="font-semibold mb-3 text-sm border-b border-gray-800 pb-2 text-white">Article tools</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href={`/edit/${article.slug}`}
                    className="text-[#58a6ff] hover:underline"
                  >
                    Edit this page
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="text-[#58a6ff] hover:underline disabled:text-gray-600"
                  >
                    {verifying ? 'Verifying...' : 'Verify accuracy'}
                  </button>
                </li>
                <li>
                  <Link
                    href={`/history/${article.slug}`}
                    className="text-[#58a6ff] hover:underline"
                  >
                    View history
                  </Link>
                </li>
              </ul>
              
              <h3 className="font-semibold mb-3 text-sm border-b border-gray-800 pb-2 mt-4 text-white">Category</h3>
              <Link
                href={`/categories/${article.category}`}
                className="text-[#58a6ff] hover:underline text-sm capitalize"
              >
                {article.category}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
