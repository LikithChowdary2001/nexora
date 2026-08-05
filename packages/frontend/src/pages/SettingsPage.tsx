import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@nexora/shared';
import api from '@/lib/api';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    await api.put('/users/preferences', { language: lang });
    await api.put('/users/profile', { language: lang });
  };

  const sections = [
    {
      title: t('settings.theme'),
      content: (
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((th) => (
            <Button key={th} variant={theme === th ? 'default' : 'outline'} onClick={() => setTheme(th)} className="rounded-button capitalize flex-1">{th}</Button>
          ))}
        </div>
      ),
    },
    {
      title: t('settings.language'),
      content: (
        <Select value={profile?.language || 'en'} onValueChange={handleLanguageChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{LANGUAGE_NAMES[l]}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
    {
      title: t('settings.notifications'),
      content: (
        <div className="space-y-4">
          {[
            { label: 'Push Notifications', default: true },
            { label: 'Email Digest (9 AM)', default: true },
            { label: 'Breaking News Alerts', default: false },
            { label: 'AI Recommendations', default: true },
          ].map(({ label, default: def }) => (
            <div key={label} className="flex items-center justify-between">
              <Label className="font-normal">{label}</Label>
              <Switch defaultChecked={def} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Privacy & Security',
      content: (
        <div className="space-y-3">
          <Button variant="outline" className="w-full rounded-button justify-start"><Shield className="h-4 w-4 mr-2" /> Change Password</Button>
          <Button variant="outline" className="w-full rounded-button justify-start text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete My Data</Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="page-container py-8 max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-display mb-1">{t('settings.title')}</h1>
          <p className="text-muted-foreground">Manage your preferences and account</p>
        </motion.div>

        {sections.map(({ title, content }) => (
          <motion.div key={title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <h2 className="font-semibold">{title}</h2>
            {content}
          </motion.div>
        ))}

        <div className="text-center text-xs text-muted-foreground pt-4">
          Nexora v1.0 — AI Powered Personalized News Assistant
        </div>
      </div>
    </AppLayout>
  );
}
