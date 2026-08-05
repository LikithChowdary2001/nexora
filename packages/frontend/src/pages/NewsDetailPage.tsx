import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Bookmark, Share2, Clock, ExternalLink, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { NewsCardSkeleton } from '@/components/ui/skeleton';
import { shareArticle, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import type { NewsArticle } from '@nexora/shared';

export function NewsDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const url = params.get('url') ?? '';
  const title = params.get('title') ?? '';
  const source = params.get('source') ?? '';

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id, url],
    queryFn: async () => {
      const { data } = await api.get(`/news/article/${id}/summary`, {
        params: { url, title, source, description: params.get('description') ?? '' },
      });
      return data.data as NewsArticle;
    },
    enabled: !!id,
  });

  const { data: related = [] } = useQuery<NewsArticle[]>({
    queryKey: ['related', title],
    queryFn: async () => {
      const { data } = await api.post('/search', { query: title.split(' ').slice(0, 3).join(' ') });
      return (data.data?.articles ?? []).filter((a: NewsArticle) => a.id !== id).slice(0, 4);
    },
    enabled: !!title,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => { if (article) await api.post('/bookmarks', { article }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const display = article ?? {
    id: id ?? '', title, url, source, description: '',
    publishedAt: new Date().toISOString(), readingTimeMinutes: 3,
    provider: 'google-news-rss' as const,
  };

  return (
    <AppLayout hideBottomNav>
      <div className="page-container py-6 max-w-4xl">
        <Button variant="ghost" className="rounded-button mb-6 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {isLoading ? (
          <NewsCardSkeleton />
        ) : (
          <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {display.imageUrl && (
              <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8">
                <img src={display.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            )}

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{display.source}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {display.readingTimeMinutes} min read
                </span>
                {display.publishedAt && (
                  <span className="text-sm text-muted-foreground">{formatDate(display.publishedAt)}</span>
                )}
              </div>

              <h1 className="text-display text-balance leading-tight">{display.title}</h1>

              {display.aiSummary && (
                <div className="glass-card p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">AI Executive Summary</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{display.aiSummary}</p>
                </div>
              )}

              {display.description && (
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed text-lg">{display.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                <Button variant="gradient" className="rounded-button" onClick={() => window.open(display.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Read Full Article
                </Button>
                <Button variant="outline" className="rounded-button" onClick={() => bookmarkMutation.mutate()}>
                  <Bookmark className="h-4 w-4 mr-2" /> Save
                </Button>
                <Button variant="outline" className="rounded-button" onClick={() => shareArticle(display.title, display.url)}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </div>

            {related.length > 0 && (
              <section className="mt-12 pt-8 border-t border-border/50">
                <h2 className="text-heading mb-6">Related News</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {related.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/news/${a.id}?url=${encodeURIComponent(a.url)}&title=${encodeURIComponent(a.title)}`)}
                      className="text-left glass-card p-4 hover:shadow-glass transition-shadow rounded-2xl"
                    >
                      <p className="font-medium text-sm line-clamp-2 mb-1">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.source}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </motion.article>
        )}
      </div>
    </AppLayout>
  );
}
