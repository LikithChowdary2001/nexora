import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl glass-card">
          <Icon className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-heading text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="gradient" onClick={onAction} className="rounded-button">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
