import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Bookmark, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50 safe-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 pb-safe-bottom">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] rounded-xl transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn('h-5 w-5 relative z-10', active && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppLogo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 group', className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-md group-hover:blur-lg transition-all" />
        <Sparkles className="h-6 w-6 text-primary relative" />
      </div>
      <span className="font-bold text-lg gradient-text hidden sm:inline">Nexora</span>
    </Link>
  );
}
