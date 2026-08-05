/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        nexora: {
          blue: '#2563EB',
          purple: '#7C3AED',
          cyan: '#06b6d4',
          navy: '#020617',
          electric: '#3B82F6',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        xl: 'var(--radius-card)',
        '2xl': 'var(--radius-card)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        button: 'var(--radius-button)',
        input: 'var(--radius-input)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        glow: {
          '0%': { opacity: '0.4', filter: 'blur(20px)' },
          '100%': { opacity: '0.8', filter: 'blur(30px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        glass: 'var(--shadow-glass)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
