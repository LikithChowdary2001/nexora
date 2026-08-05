import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, User, Globe, Languages, Briefcase, Heart,
  Plus, Check, ChevronRight, ChevronLeft, Loader2, PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getLocalGreeting, formatDate } from '@/lib/utils';
import {
  COUNTRIES, PROFESSIONS, LANGUAGE_NAMES, SUPPORTED_LANGUAGES,
  INTEREST_CATEGORIES, recommendInterests, type SupportedLanguage,
} from '@nexora/shared';
import { saveOnboardingToFirestore } from '@/lib/onboarding-fallback';

const STEPS = [
  { id: 'welcome', icon: Sparkles, title: 'Welcome to Nexora' },
  { id: 'name', icon: User, title: 'Your Name' },
  { id: 'age', icon: User, title: 'Your Age' },
  { id: 'country', icon: Globe, title: 'Your Country' },
  { id: 'language', icon: Languages, title: 'Your Language' },
  { id: 'profession', icon: Briefcase, title: 'Your Profession' },
  { id: 'interests', icon: Heart, title: 'Your Interests' },
  { id: 'custom', icon: Plus, title: 'Other Interests' },
  { id: 'finish', icon: PartyPopper, title: 'All Set!' },
];

export function OnboardingPage() {
  const { i18n } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [recommended, setRecommended] = useState<string[]>([]);

  const [form, setForm] = useState({
    firstName: '', lastName: '', age: '', country: '', language: 'en' as SupportedLanguage,
    profession: '', interests: [] as string[], customInterests: [] as string[],
  });

  const update = (key: string, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleInterest = (interest: string) => {
    const current = form.interests;
    update('interests', current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest]);
  };

  const fetchRecommendations = async () => {
    if (!form.age || !form.profession || !form.country) return;

    // Always show local recommendations immediately (works offline / when API auth fails)
    setRecommended(recommendInterests(+form.age, form.profession, form.country));

    try {
      const { data } = await api.get('/users/recommended-interests', {
        params: { age: form.age, profession: form.profession, country: form.country },
      });
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRecommended(data.data);
      }
    } catch {
      // API unavailable — local recommendations already applied
    }
  };

  useEffect(() => {
    if (!user) return;
    api.post('/users/bootstrap').catch(() => {});
    refreshProfile().catch(() => {});
  }, [user, refreshProfile]);

  const canProceed = () => {
    switch (STEPS[step]?.id) {
      case 'welcome': return true;
      case 'name': return form.firstName.trim() && form.lastName.trim();
      case 'age': return form.age && +form.age >= 13 && +form.age <= 120;
      case 'country': return !!form.country;
      case 'language': return !!form.language;
      case 'profession': return !!form.profession;
      case 'interests': return form.interests.length > 0;
      case 'custom': return true;
      case 'finish': return true;
      default: return false;
    }
  };

  const next = async () => {
    setError('');
    if (STEPS[step]?.id === 'profession') {
      try {
        await fetchRecommendations();
      } catch {
        // Never block onboarding if recommendations fail
      }
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else await submit();
  };

  const submit = async () => {
    if (!user) {
      setError('You must be signed in to complete onboarding.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      age: +form.age,
      country: form.country,
      language: form.language,
      profession: form.profession,
      interests: form.interests,
      customInterests: form.customInterests,
    };

    try {
      await api.post('/users/onboarding', payload);
    } catch {
      try {
        await saveOnboardingToFirestore(user, payload);
      } catch {
        setError('Could not save your profile. Check your connection and try again.');
        setLoading(false);
        return;
      }
    }

    try {
      i18n.changeLanguage(form.language);
      await refreshProfile();
      setStep(STEPS.length - 1);
      setTimeout(() => navigate('/'), 2000);
    } catch {
      setError('Profile saved, but refresh failed. Try reloading the page.');
      setLoading(false);
    }
  };

  const greeting = form.firstName ? getLocalGreeting(form.firstName).greeting : '';
  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[step]?.icon ?? Sparkles;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-muted">
        <motion.div className="h-full gradient-bg" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i <= step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-8 sm:p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <StepIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Step {step + 1} of {STEPS.length}</p>
                  <h2 className="text-heading">{STEPS[step]?.title}</h2>
                </div>
              </div>

              {STEPS[step]?.id === 'welcome' && (
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Nexora learns your interests and delivers AI-curated news tailored just for you.
                    Let's personalize your experience in a few quick steps.
                  </p>
                  <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
                  {user?.email && <p className="text-sm"><span className="text-muted-foreground">Signed in as </span>{user.email}</p>}
                </div>
              )}

              {STEPS[step]?.id === 'name' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="John" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Doe" />
                  </div>
                  {greeting && <p className="sm:col-span-2 text-sm text-primary font-medium">{greeting}</p>}
                </div>
              )}

              {STEPS[step]?.id === 'age' && (
                <div className="space-y-2 max-w-xs">
                  <Label>Age</Label>
                  <Input type="number" min={13} max={120} value={form.age} onChange={(e) => update('age', e.target.value)} placeholder="25" autoFocus />
                  <p className="text-xs text-muted-foreground">Must be 13 or older</p>
                </div>
              )}

              {STEPS[step]?.id === 'country' && (
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={form.country} onValueChange={(v) => update('country', v)}>
                    <SelectTrigger><SelectValue placeholder="Select your country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {STEPS[step]?.id === 'language' && (
                <div className="space-y-2">
                  <Label>Preferred Language</Label>
                  <Select value={form.language} onValueChange={(v) => update('language', v)}>
                    <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{LANGUAGE_NAMES[l]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {STEPS[step]?.id === 'profession' && (
                <div className="space-y-2">
                  <Label>Profession</Label>
                  <Select value={form.profession} onValueChange={(v) => update('profession', v)}>
                    <SelectTrigger><SelectValue placeholder="Select profession" /></SelectTrigger>
                    <SelectContent>
                      {PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {STEPS[step]?.id === 'interests' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Select topics you're interested in</p>
                  <div className="flex flex-wrap gap-2">
                    {(recommended.length ? recommended : INTEREST_CATEGORIES.slice(0, 12)).map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                          form.interests.includes(interest)
                            ? 'gradient-bg text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {form.interests.includes(interest) && <Check className="inline h-3.5 w-3.5 mr-1" />}
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {STEPS[step]?.id === 'custom' && (
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={showCustom} onCheckedChange={(c) => setShowCustom(!!c)} />
                    <span className="text-sm">I have other interests not listed above</span>
                  </label>
                  {showCustom && (
                    <div className="flex gap-2">
                      <Input
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter custom interest..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customInput.trim()) {
                            update('customInterests', [...form.customInterests, customInput.trim()]);
                            toggleInterest(customInput.trim());
                            setCustomInput('');
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="rounded-button" onClick={() => {
                        if (customInput.trim()) {
                          update('customInterests', [...form.customInterests, customInput.trim()]);
                          toggleInterest(customInput.trim());
                          setCustomInput('');
                        }
                      }}>Add</Button>
                    </div>
                  )}
                  {form.customInterests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.customInterests.map((i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">{i}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {STEPS[step]?.id === 'finish' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6"
                >
                  <PartyPopper className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Welcome, {form.firstName}!</h3>
                  <p className="text-muted-foreground">Your personalized news feed is ready. Redirecting...</p>
                </motion.div>
              )}

              {STEPS[step]?.id !== 'finish' && (
                <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-border/50">
                  {error && (
                    <p className="text-destructive text-sm text-center bg-destructive/10 rounded-xl p-3">{error}</p>
                  )}
                  <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    className="rounded-button"
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    variant="gradient"
                    className="rounded-button"
                    onClick={next}
                    disabled={!canProceed() || loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {step === STEPS.length - 2 ? 'Get Started' : 'Continue'}
                    {step < STEPS.length - 2 && <ChevronRight className="h-4 w-4 ml-1" />}
                  </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
