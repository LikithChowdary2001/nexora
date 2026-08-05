import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Clock, Mic, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { NewsCard } from '@/components/news/NewsCard';
import { EmptyState } from '@/components/ui/empty-state';
import api from '@/lib/api';
import type { SearchResult } from '@nexora/shared';

const TRENDING = ['Artificial Intelligence', 'Tesla', 'SpaceX', 'Bitcoin', 'Climate Change', 'Elections'];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);

  const { data, isLoading } = useQuery<SearchResult>({
    queryKey: ['search', query],
    queryFn: async () => (await api.post('/search', { query })).data.data,
    enabled: !!query,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['search-history'],
    queryFn: async () => (await api.get('/search/history')).data.data ?? [],
  });

  useEffect(() => { setInput(query); }, [query]);

  const handleSearch = (q: string) => {
    if (q.trim()) setSearchParams({ q: q.trim() });
  };

  return (
    <AppLayout>
      <div className="page-container py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-display text-center">Search</h1>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(input)}
              placeholder="Search any topic..."
              className="h-14 pl-14 pr-28 text-base glass-card border-0 rounded-2xl shadow-glass"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" aria-label="Voice search">
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="gradient" className="rounded-button h-10" onClick={() => handleSearch(input)}>Search</Button>
            </div>
          </div>
        </motion.div>

        {!query && (
          <div className="space-y-8 max-w-3xl mx-auto">
            <section>
              <h2 className="text-heading flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-primary" /> Trending</h2>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((t) => (
                  <button key={t} onClick={() => handleSearch(t)} className="px-4 py-2.5 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary text-sm font-medium transition-all">{t}</button>
                ))}
              </div>
            </section>
            {history.length > 0 && (
              <section>
                <h2 className="text-heading flex items-center gap-2 mb-4"><Clock className="h-5 w-5 text-primary" /> Recent</h2>
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 10).map((s: { id: string; query: string }) => (
                    <button key={s.id} onClick={() => handleSearch(s.query)} className="px-4 py-2 rounded-2xl border border-border text-sm hover:border-primary/50 transition-colors">{s.query}</button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        )}

        {data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="glass-card p-6 sm:p-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="accent">AI Summary</Badge>
                <span className="text-sm text-muted-foreground">{data.articles.length} results</span>
              </div>
              <h2 className="text-heading mb-3">"{data.query}"</h2>
              <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.articles.map((article, i) => (
                <NewsCard key={article.id} article={article} index={i} onRead={() => navigate(`/news/${article.id}?url=${encodeURIComponent(article.url)}`)} />
              ))}
            </div>

            {data.relatedSearches.length > 0 && (
              <section className="max-w-3xl mx-auto">
                <h3 className="font-semibold mb-3">Related Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {data.relatedSearches.map((s) => (
                    <button key={s} onClick={() => handleSearch(s)} className="px-4 py-2 rounded-2xl bg-muted text-sm hover:bg-primary/10 hover:text-primary transition-colors">{s}</button>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {query && !isLoading && data?.articles.length === 0 && (
          <EmptyState icon={Search} title="No results found" description={`We couldn't find news for "${query}". Try a different search.`} actionLabel="Try Trending" onAction={() => handleSearch('Technology')} />
        )}
      </div>
    </AppLayout>
  );
}
