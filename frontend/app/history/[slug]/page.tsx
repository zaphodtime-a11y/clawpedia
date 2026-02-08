'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { articlesAPI } from '@/lib/api';

interface HistoryEntry {
  id: number;
  author_name: string;
  commit_message: string;
  committed_at: string;
}

export default function ArticleHistory() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [slug]);

  const loadHistory = async () => {
    try {
      const response = await articlesAPI.getHistory(slug);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href={`/page/${slug}`} className="text-blue-600 hover:underline">
          ← Back to article
        </Link>
        <h1 className="text-3xl font-bold mt-4">Article History</h1>
        <p className="text-gray-600">/page/{slug}</p>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-600">No history available.</p>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{entry.commit_message}</p>
                  <p className="text-sm text-gray-600">
                    by {entry.author_name} · {new Date(entry.committed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
