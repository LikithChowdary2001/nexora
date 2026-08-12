import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Sparkles, TrendingUp, Bookmark, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsCardSkeleton, BriefingSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import api from '@/lib/api';
import { safeGet } from '@/lib/safe-api';
import type { NewsArticle, AIBriefing } from '@nexora/shared';

const QUICK_SUGGESTIONS = [
  'AI', 'Technology', 'Business', 'Finance', 'Sports',
  'Programming', 'Space', 'Cybersecurity', 'Gaming', 'Health',
];

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: feed = [], isLoading: feedLoading, isError: feedError } = useQuery<NewsArticle[]>({
    queryKey: ['feed'],
    queryFn: () => safeGet<NewsArticle[]>('/news/feed', []),
    retry: 1,
  });
  const { data: trending = [], isLoading: trendingLoading } = useQuery<NewsArticle[]>({
    queryKey: ['trending'],
    queryFn: () => safeGet<NewsArticle[]>('/news/trending', []),
    retry: 1,
  });
  const { data: briefing, isLoading: briefingLoading } = useQuery<AIBriefing | null>({
    queryKey: ['briefing'],
    queryFn: () => safeGet<AIBriefing | null>('/news/briefing', null, 120_000),
    retry: 0,
  });
  const { data: bookmarks = [] } = useQuery<{ id: string; articleId: string; article: NewsArticle }[]>({
    queryKey: ['bookmarks'],
    queryFn: () => safeGet('/bookmarks', []),
    retry: 0,
  });
  const { data: continueReading = [] } = useQuery<{ id: string; article: NewsArticle }[]>({
    queryKey: ['continue-reading'],
    queryFn: () => safeGet('/news/continue-reading', []),
    retry: 0,
  });
  const { data: searchHistory = [] } = useQuery<{ id: string; query: string }[]>({
    queryKey: ['search-history'],
    queryFn: () => safeGet('/search/history', []),
    retry: 0,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (article: NewsArticle) => { await api.post('/bookmarks', { article }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
  const readMutation = useMutation({
    mutationFn: async (article: NewsArticle) => { await api.post('/news/read', { article }); },
  });

  const bookmarkedIds = new Set(bookmarks.map((b) => b.articleId));

  return (
    <AppLayout showGreeting>
      <div className="page-container py-8 space-y-12">
        {/* Hero Search */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 py-4"
        >
          <h2 className="text-display text-balance max-w-2xl mx-auto">
            What would you like to <span className="gradient-text">know</span> today?
          </h2>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="What would you like to know today?"
              className="h-14 pl-14 pr-6 text-base glass-card border-0 shadow-glass rounded-2xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value.trim();
                  if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
                }
              }}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                className="px-4 py-2 rounded-2xl text-sm font-medium bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.section>

        {/* AI Briefing */}
        <section>
          {briefingLoading ? <BriefingSkeleton /> : briefing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-heading">{t('home.briefing')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">{briefing.executiveSummary}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {briefing.keyTakeaways.slice(0, 4).map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* Recommended */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> {t('home.recommended')}
            </h2>
          </div>
          {feedLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <NewsCardSkeleton key={i} />)}
            </div>
          ) : feed.length === 0 ? (
            <EmptyState icon={Sparkles} title={feedError ? 'Could not load feed' : 'No recommendations yet'} description={feedError ? 'The server may be waking up — try refreshing in a moment.' : 'Complete your profile to get personalized news.'} actionLabel="Update Profile" onAction={() => navigate('/profile')} />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feed.slice(0, 9).map((article, i) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  index={i}
                  isBookmarked={bookmarkedIds.has(article.id)}
                  onBookmark={(a) => bookmarkMutation.mutate(a)}
                  onRead={(a) => { readMutation.mutate(a); navigate(`/news/${article.id}?url=${encodeURIComponent(a.url)}&title=${encodeURIComponent(a.title)}`); }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Trending */}
        <section>
          <h2 className="text-heading flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" /> {t('home.trending')}
          </h2>
          {trendingLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <NewsCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.slice(0, 6).map((article, i) => (
                <NewsCard key={article.id} article={article} index={i} isBookmarked={bookmarkedIds.has(article.id)} onBookmark={(a) => bookmarkMutation.mutate(a)} onRead={(a) => navigate(`/news/${article.id}?url=${encodeURIComponent(a.url)}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Bookmarks + Continue Reading */}
        <div className="grid md:grid-cols-2 gap-8">
          {bookmarks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading flex items-center gap-2"><Bookmark className="h-5 w-5 text-primary" /> Saved</h2>
                <button onClick={() => navigate('/bookmarks')} className="text-sm text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></button>
              </div>
              <div className="space-y-3">
                {bookmarks.slice(0, 4).map((b) => (
                  <NewsCard key={b.id} article={b.article} compact onRead={() => navigate(`/news/${b.article.id}`)} />
                ))}
              </div>
            </section>
          )}
          {continueReading.length > 0 && (
            <section>
              <h2 className="text-heading flex items-center gap-2 mb-4"><Clock className="h-5 w-5 text-primary" /> Continue Reading</h2>
              <div className="space-y-3">
                {continueReading.slice(0, 4).map((e) => (
                  <NewsCard key={e.id} article={e.article} compact onRead={() => navigate(`/news/${e.article.id}`)} />
                ))}
              </div>
            </section>
          )}
        </div>

        {searchHistory.length > 0 && (
          <section>
            <h2 className="text-heading mb-4">{t('home.recentSearches')}</h2>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(0, 8).map((s) => (
                <button key={s.id} onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)} className="px-4 py-2 rounded-2xl bg-muted text-sm hover:bg-primary/10 hover:text-primary transition-colors">{s.query}</button>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
