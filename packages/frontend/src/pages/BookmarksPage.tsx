import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bookmark, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import api from '@/lib/api';
import type { NewsArticle } from '@nexora/shared';

export function BookmarksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => (await api.get('/bookmarks')).data.data ?? [],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/bookmarks/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const filtered = bookmarks
    .filter((b: { article: NewsArticle }) =>
      !search || b.article.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: { createdAt: string }, b: { createdAt: string }) =>
      sort === 'newest'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  return (
    <AppLayout>
      <div className="page-container py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-display mb-2">Saved Articles</h1>
          <p className="text-muted-foreground">{bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 rounded-2xl"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
            className="h-12 rounded-input border border-input bg-background px-4 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <NewsCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={search ? 'No matching bookmarks' : 'No saved articles yet'}
            description="Bookmark articles while reading to save them here."
            actionLabel="Explore News"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b: { id: string; article: NewsArticle }, i: number) => (
              <div key={b.id} className="relative group">
                <NewsCard article={b.article} index={i} isBookmarked onRead={() => navigate(`/news/${b.article.id}`)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 bg-background/80 backdrop-blur transition-opacity"
                  onClick={() => deleteMutation.mutate(b.id)}
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
