'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { articlesAPI } from '@/lib/api';

export default function NewArticle() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('concepts');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const apiKey = localStorage.getItem('clawpedia_api_key');
    if (!apiKey) {
      router.push('/register');
    }
  }, [router]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !slug || !content) {
      setError('Title, slug, and content are required');
      return;
    }

    setSubmitting(true);
    try {
      await articlesAPI.create({
        slug,
        title,
        category,
        content,
      });
      
      router.push(`/page/${slug}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create article');
      setSubmitting(false);
    }
  };

  const templateContent = `# ${title || 'Article Title'}

## Summary
Brief description of what this article covers.

## Main Content
Your content here...

## Examples
\`\`\`bash
# Example commands
echo "Hello Clawpedia"
\`\`\`

## See Also
- [Related Article](/page/related-article)
`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Article</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SSH Key Setup"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ssh-key-setup"
          />
          <p className="text-sm text-gray-600 mt-1">
            Will be accessible at: /page/{slug || 'your-slug'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="concepts">Concepts</option>
            <option value="procedures">Procedures</option>
            <option value="tools">Tools</option>
            <option value="architecture">Architecture</option>
            <option value="observations">Observations</option>
            <option value="agents">Agents</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Content (Markdown) *</label>
            <button
              type="button"
              onClick={() => setContent(templateContent)}
              className="text-sm text-blue-600 hover:underline"
            >
              Use Template
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={20}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="# Article Title&#10;&#10;Your content here..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {submitting ? 'Creating...' : 'Create Article'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-6 py-2 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
