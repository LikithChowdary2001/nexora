import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { sendEmailVerification } from 'firebase/auth';
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ParticleBackground, NexoraLogo } from '@/components/auth/ParticleBackground';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

const signUpSchema = signInSchema.extend({
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((v) => v, 'You must accept the terms'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type AuthMode = 'signin' | 'signup' | 'forgot' | 'verify';

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  const schema = mode === 'signup' ? signUpSchema : signInSchema;
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(data.email as string, data.password as string);
      } else if (mode === 'signup') {
        await signUp(data.email as string, data.password as string);
        setVerifyEmail(data.email as string);
        setMode('verify');
      } else if (mode === 'forgot') {
        await resetPassword(data.email as string);
        setSuccess('Password reset email sent. Check your inbox.');
        setTimeout(() => setMode('signin'), 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setSuccess('Verification email resent.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8 sm:p-10 shadow-glass">
          {mode === 'verify' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-glow" />
                <div className="relative flex items-center justify-center h-full w-full rounded-2xl bg-primary/10">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We sent a verification link to <strong>{verifyEmail}</strong>.
                  Click the link to activate your account.
                </p>
              </div>
              <Button variant="outline" className="w-full rounded-button" onClick={resendVerification}>
                Resend verification email
              </Button>
              <button onClick={() => setMode('signin')} className="text-sm text-primary hover:underline">
                Back to Sign In
              </button>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4"><NexoraLogo /></div>
                <motion.h1
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold"
                >
                  {mode === 'signin' && t('auth.signIn')}
                  {mode === 'signup' && t('auth.signUp')}
                  {mode === 'forgot' && t('auth.forgotPassword')}
                </motion.h1>
                <p className="text-muted-foreground text-sm mt-1">{t('app.tagline')}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-11" {...register('email')} aria-invalid={!!errors.email} />
                  </div>
                  {errors.email && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-destructive text-xs">{errors.email.message as string}</motion.p>
                  )}
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-11 pr-11" {...register('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs">{errors.password.message as string}</p>}
                  </div>
                )}

                {mode === 'signup' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
                      {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message as string}</p>}
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox onCheckedChange={(c) => setValue('acceptTerms', !!c)} />
                      <span className="text-xs text-muted-foreground leading-relaxed">I agree to the Terms of Service and Privacy Policy</span>
                    </label>
                  </>
                )}

                {mode === 'signin' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox {...register('rememberMe')} />
                      {t('auth.rememberMe')}
                    </label>
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-sm text-primary hover:underline">
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className="text-destructive text-sm text-center bg-destructive/10 rounded-xl p-3">{error}</motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-xl p-3">
                      <CheckCircle2 className="h-4 w-4" /> {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" variant="gradient" size="lg" className="w-full rounded-button" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</span>
                  ) : (
                    <>{mode === 'signin' && t('auth.signIn')}{mode === 'signup' && t('auth.signUp')}{mode === 'forgot' && 'Send Reset Link'}</>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === 'signin' && <>Don't have an account? <button onClick={() => { setMode('signup'); setError(''); }} className="text-primary hover:underline font-medium">{t('auth.signUp')}</button></>}
                {mode === 'signup' && <>Already have an account? <button onClick={() => { setMode('signin'); setError(''); }} className="text-primary hover:underline font-medium">{t('auth.signIn')}</button></>}
                {mode === 'forgot' && <button onClick={() => { setMode('signin'); setError(''); }} className="text-primary hover:underline flex items-center gap-1 mx-auto"><ArrowLeft className="h-3 w-3" /> Back to Sign In</button>}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
