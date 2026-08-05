import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Bell, Settings, Shield, LogOut, ChevronDown, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppLogo, BottomNav } from '@/components/layout/BottomNav';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalGreeting, formatDate } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  showGreeting?: boolean;
  hideBottomNav?: boolean;
}

export function AppLayout({ children, showGreeting = false, hideBottomNav = false }: AppLayoutProps) {
  const { t } = useTranslation();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const greeting = profile ? getLocalGreeting(profile.firstName) : null;
  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="page-container flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <AppLogo />
            {showGreeting && greeting && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:block min-w-0"
              >
                <p className="font-semibold text-sm truncate">{greeting.greeting}</p>
                <p className="text-xs text-muted-foreground">{formatDate(new Date())}</p>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            {profile?.role === 'admin' && (
              <Button variant="ghost" size="icon" className="rounded-xl hidden sm:flex" onClick={() => navigate('/admin')} aria-label="Admin">
                <Shield className="h-5 w-5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatarUrl} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm">{profile?.firstName} {profile?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" /> {t('settings.title')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className={hideBottomNav ? '' : 'pb-20 md:pb-8'}>
        {children}
      </main>

      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
