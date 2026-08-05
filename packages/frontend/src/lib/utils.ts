import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getLocalGreeting(firstName: string): {
  greeting: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
} {
  const hour = new Date().getHours();
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  let greeting: string;

  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
    greeting = `Good Morning, ${firstName}`;
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
    greeting = `Good Afternoon, ${firstName}`;
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
    greeting = `Good Evening, ${firstName}`;
  } else {
    timeOfDay = 'night';
    greeting = `Good Night, ${firstName}`;
  }

  return { greeting, timeOfDay };
}

export async function shareArticle(title: string, url: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({ title, url });
  } else {
    await navigator.clipboard.writeText(url);
  }
}
