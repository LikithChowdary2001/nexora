import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { loadProfileLocally } from '@/lib/profile-storage';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';
import '@/lib/i18n';

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage').then((m) => ({ default: m.NewsDetailPage })));
const BookmarksPage = lazy(() => import('@/pages/BookmarksPage').then((m) => ({ default: m.BookmarksPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const NotFoundPage = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.NotFoundPage })));
const ServerErrorPage = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.ServerErrorPage })));
const OfflinePage = lazy(() => import('@/pages/ErrorPages').then((m) => ({ default: m.OfflinePage })));
const AIAssistant = lazy(() => import('@/components/ai/AIAssistant').then((m) => ({ default: m.AIAssistant })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
        <Skeleton className="h-12 w-12 rounded-2xl relative" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading Nexora...</p>
    </div>
  );
}

function LoginRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  const localCompleted = user ? loadProfileLocally(user.uid)?.onboardingCompleted : false;
  if (user && (profile?.onboardingCompleted || localCompleted)) return <Navigate to="/" replace />;
  if (user) return <Navigate to="/onboarding" replace />;
  return <LoginPage />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const uid = user.uid;
  const localProfile = uid ? loadProfileLocally(uid) : null;
  const effectiveProfile = profile ?? localProfile;

  if (!effectiveProfile?.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const localProfile = loadProfileLocally(user.uid);
  if (profile?.onboardingCompleted || localProfile?.onboardingCompleted) {
    return <Navigate to="/" replace />;
  }
  return <OnboardingPage />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/news/:id" element={<ProtectedRoute><NewsDetailPage /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {user && (
        <Suspense fallback={null}>
          <AIAssistant />
        </Suspense>
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
