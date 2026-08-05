import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Toggle theme">
          {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem onClick={() => setTheme('light')} className="rounded-lg cursor-pointer gap-2">
          <Sun className="h-4 w-4" /> Light {theme === 'light' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="rounded-lg cursor-pointer gap-2">
          <Moon className="h-4 w-4" /> Dark {theme === 'dark' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="rounded-lg cursor-pointer gap-2">
          <Monitor className="h-4 w-4" /> System {theme === 'system' && '✓'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
