import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <span className="relative text-8xl font-bold gradient-text">404</span>
        </div>
        <h1 className="text-display text-foreground mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" className="rounded-button" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
          <Button variant="gradient" className="rounded-button" asChild>
            <Link to="/"><Home className="h-4 w-4 mr-2" /> Home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-6" />
        <h1 className="text-display text-foreground mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">We're working on it. Please try again in a moment.</p>
        <Button variant="gradient" className="rounded-button" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </motion.div>
    </div>
  );
}

export function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
        <WifiOff className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-display text-foreground mb-3">You're offline</h1>
        <p className="text-muted-foreground mb-8">
          Check your connection. Cached content may still be available.
        </p>
        <Button variant="gradient" className="rounded-button" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </motion.div>
    </div>
  );
}
