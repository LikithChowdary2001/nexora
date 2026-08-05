import type { SupportedLanguage } from './types.js';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  hi: 'Hindi',
  te: 'Telugu',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese',
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES) as SupportedLanguage[];

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
  'Germany',
  'France',
  'Japan',
  'China',
  'Brazil',
  'Mexico',
  'Spain',
  'Italy',
  'Netherlands',
  'South Korea',
  'Singapore',
  'United Arab Emirates',
  'South Africa',
  'Nigeria',
  'Other',
] as const;

export const PROFESSIONS = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'Designer',
  'Marketing',
  'Finance',
  'Healthcare',
  'Education',
  'Legal',
  'Consulting',
  'Entrepreneur',
  'Student',
  'Researcher',
  'Journalist',
  'Other',
] as const;

export function getGreeting(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreetingText(
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  firstName: string,
  language: SupportedLanguage = 'en'
): string {
  const greetings: Record<SupportedLanguage, Record<string, string>> = {
    en: {
      morning: `Good Morning, ${firstName}`,
      afternoon: `Good Afternoon, ${firstName}`,
      evening: `Good Evening, ${firstName}`,
      night: `Good Night, ${firstName}`,
    },
    es: {
      morning: `Buenos Días, ${firstName}`,
      afternoon: `Buenas Tardes, ${firstName}`,
      evening: `Buenas Noches, ${firstName}`,
      night: `Buenas Noches, ${firstName}`,
    },
    hi: {
      morning: `सुप्रभात, ${firstName}`,
      afternoon: `नमस्कार, ${firstName}`,
      evening: `शुभ संध्या, ${firstName}`,
      night: `शुभ रात्रि, ${firstName}`,
    },
    te: {
      morning: `శుభోదయం, ${firstName}`,
      afternoon: `శుభ మధ్యాహ్నం, ${firstName}`,
      evening: `శుభ సాయంత్రం, ${firstName}`,
      night: `శుభ రాత్రి, ${firstName}`,
    },
    fr: {
      morning: `Bonjour, ${firstName}`,
      afternoon: `Bon Après-midi, ${firstName}`,
      evening: `Bonsoir, ${firstName}`,
      night: `Bonne Nuit, ${firstName}`,
    },
    de: {
      morning: `Guten Morgen, ${firstName}`,
      afternoon: `Guten Tag, ${firstName}`,
      evening: `Guten Abend, ${firstName}`,
      night: `Gute Nacht, ${firstName}`,
    },
    ja: {
      morning: `おはようございます、${firstName}`,
      afternoon: `こんにちは、${firstName}`,
      evening: `こんばんは、${firstName}`,
      night: `おやすみなさい、${firstName}`,
    },
    zh: {
      morning: `早上好，${firstName}`,
      afternoon: `下午好，${firstName}`,
      evening: `晚上好，${firstName}`,
      night: `晚安，${firstName}`,
    },
  };

  return greetings[language][timeOfDay];
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function generateArticleId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `article_${Math.abs(hash).toString(36)}`;
}

export function recommendInterests(
  age: number,
  profession: string,
  country: string
): string[] {
  const base = ['Technology', 'World News'];
  const recommendations: string[] = [...base];

  const professionMap: Record<string, string[]> = {
    'Software Engineer': ['Programming', 'Artificial Intelligence', 'Cybersecurity'],
    'Data Scientist': ['Artificial Intelligence', 'Science', 'Technology'],
    'Product Manager': ['Business', 'Technology', 'Finance'],
    Designer: ['Technology', 'Lifestyle', 'Movies'],
    Marketing: ['Business', 'Lifestyle', 'Movies'],
    Finance: ['Finance', 'Business', 'Politics'],
    Healthcare: ['Healthcare', 'Science', 'Education'],
    Education: ['Education', 'Science', 'World News'],
    Legal: ['Politics', 'Business', 'World News'],
    Consulting: ['Business', 'Finance', 'Technology'],
    Entrepreneur: ['Business', 'Finance', 'Technology'],
    Student: ['Education', 'Technology', 'Science'],
    Researcher: ['Science', 'Artificial Intelligence', 'Education'],
    Journalist: ['Politics', 'World News', 'Business'],
  };

  const profInterests = professionMap[profession] ?? ['Business', 'Technology'];
  recommendations.push(...profInterests);

  if (age < 25) {
    recommendations.push('Gaming', 'Music', 'Sports');
  } else if (age < 40) {
    recommendations.push('Business', 'Travel', 'Finance');
  } else {
    recommendations.push('Healthcare', 'Politics', 'Finance');
  }

  const countryMap: Record<string, string[]> = {
    India: ['Cricket', 'Politics', 'Technology'],
    'United States': ['Politics', 'Sports', 'Technology'],
    'United Kingdom': ['Politics', 'Sports', 'Business'],
    Japan: ['Technology', 'Automotive', 'Gaming'],
    China: ['Technology', 'Business', 'World News'],
    Germany: ['Automotive', 'Technology', 'Business'],
  };

  const countryInterests = countryMap[country] ?? ['World News'];
  recommendations.push(...countryInterests);

  return [...new Set(recommendations)].slice(0, 10);
}
