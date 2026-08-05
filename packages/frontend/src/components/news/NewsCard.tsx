import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bookmark, Share2, ExternalLink, Clock, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, shareArticle, formatDate } from '@/lib/utils';
import type { NewsArticle } from '@nexora/shared';

interface NewsCardProps {
  article: NewsArticle;
  isBookmarked?: boolean;
  onBookmark?: (article: NewsArticle) => void;
  onRead?: (article: NewsArticle) => void;
  compact?: boolean;
  index?: number;
}

export function NewsCard({ article, isBookmarked, onBookmark, onRead, compact, index = 0 }: NewsCardProps) {
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();

  const handleOpen = () => {
    onRead?.(article);
    navigate(`/news/${article.id}?url=${encodeURIComponent(article.url)}&title=${encodeURIComponent(article.title)}&source=${encodeURIComponent(article.source)}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group glass-card overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-glass',
        compact ? '' : ''
      )}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
    >
      {!compact && article.imageUrl && (
        <div className="relative h-52 overflow-hidden">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          <Badge variant="default" className="absolute top-4 left-4">{article.source}</Badge>
        </div>
      )}

      <div className={cn('space-y-3', compact ? 'p-4' : 'p-6')}>
        {!compact && !article.imageUrl && (
          <Badge variant="outline">{article.source}</Badge>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {compact && <span className="font-medium text-primary">{article.source}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readingTimeMinutes} min</span>
          {article.publishedAt && <span>• {formatDate(article.publishedAt)}</span>}
        </div>

        <h3 className={cn('font-semibold leading-snug group-hover:text-primary transition-colors text-balance', compact ? 'text-sm line-clamp-2' : 'text-base line-clamp-3')}>
          {article.title}
        </h3>

        {(article.aiSummary || article.description) && !compact && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {article.aiSummary || article.description}
          </p>
        )}

        <div className="flex items-center gap-1 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl p-0" onClick={() => onBookmark?.(article)} aria-label="Bookmark">
            <Bookmark className={cn('h-4 w-4 transition-colors', isBookmarked && 'fill-primary text-primary')} />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl p-0" onClick={() => setLiked(!liked)} aria-label="Like">
            <Heart className={cn('h-4 w-4 transition-colors', liked && 'fill-red-500 text-red-500')} />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl p-0" onClick={() => shareArticle(article.title, article.url)} aria-label="Share">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 rounded-xl ml-auto text-primary gap-1" onClick={handleOpen}>
            Read <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
