import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      app: { name: 'Nexora', tagline: 'AI Powered Personalized News Assistant' },
      auth: {
        signIn: 'Sign In', signUp: 'Create Account', forgotPassword: 'Forgot Password',
        email: 'Email', password: 'Password', rememberMe: 'Remember Me',
        noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
        verifyEmail: 'Please verify your email address',
        resetSent: 'Password reset email sent',
      },
      onboarding: {
        welcome: 'Welcome to Nexora', subtitle: "Let's personalize your news experience",
        firstName: 'First Name', lastName: 'Last Name', age: 'Age', country: 'Country',
        language: 'Language', profession: 'Profession', interests: 'Select Your Interests',
        other: 'Other', customInterest: 'Enter custom interest', continue: 'Continue',
        finish: 'Get Started',
      },
      home: {
        briefing: "Today's AI Briefing", trending: 'Trending News', recommended: 'Recommended For You',
        bookmarks: 'Bookmarks', continueReading: 'Continue Reading', recentSearches: 'Recent Searches',
        dailyDigest: 'Daily Digest', search: 'Search news...',
      },
      news: { readMore: 'Read Full Article', bookmark: 'Bookmark', share: 'Share', minRead: 'min read' },
      ai: { assistant: 'AI Assistant', placeholder: 'Ask anything about the news...', send: 'Send' },
      settings: { title: 'Settings', theme: 'Theme', language: 'Language', notifications: 'Notifications' },
      admin: { dashboard: 'Admin Dashboard', users: 'Users', analytics: 'Analytics', health: 'System Health' },
      common: { loading: 'Loading...', error: 'Something went wrong', save: 'Save', cancel: 'Cancel', logout: 'Log Out' },
    },
  },
  es: {
    translation: {
      app: { name: 'Nexora', tagline: 'Asistente de Noticias Personalizado con IA' },
      auth: { signIn: 'Iniciar Sesión', signUp: 'Crear Cuenta', forgotPassword: 'Olvidé mi Contraseña', email: 'Correo', password: 'Contraseña', rememberMe: 'Recordarme', noAccount: '¿No tienes cuenta?', hasAccount: '¿Ya tienes cuenta?', verifyEmail: 'Verifica tu correo', resetSent: 'Correo de restablecimiento enviado' },
      home: { briefing: 'Resumen IA de Hoy', trending: 'Noticias Trending', recommended: 'Recomendado Para Ti', bookmarks: 'Marcadores', continueReading: 'Continuar Leyendo', recentSearches: 'Búsquedas Recientes', dailyDigest: 'Resumen Diario', search: 'Buscar noticias...' },
      common: { loading: 'Cargando...', error: 'Algo salió mal', save: 'Guardar', cancel: 'Cancelar', logout: 'Cerrar Sesión' },
    },
  },
  hi: {
    translation: {
      app: { name: 'Nexora', tagline: 'AI संचालित व्यक्तिगत समाचार सहायक' },
      auth: { signIn: 'साइन इन', signUp: 'खाता बनाएं', email: 'ईमेल', password: 'पासवर्ड' },
      home: { briefing: 'आज का AI ब्रीफिंग', trending: 'ट्रेंडिंग समाचार', recommended: 'आपके लिए अनुशंसित', search: 'समाचार खोजें...' },
      common: { loading: 'लोड हो रहा है...', error: 'कुछ गलत हुआ', logout: 'लॉग आउट' },
    },
  },
  te: {
    translation: {
      app: { name: 'Nexora', tagline: 'AI ఆధారిత వ్యక్తిగత వార్తల సహాయకుడు' },
      auth: { signIn: 'సైన్ ఇన్', signUp: 'ఖాతా సృష్టించండి', email: 'ఇమెయిల్', password: 'పాస్‌వర్డ్' },
      home: { briefing: 'నేటి AI బ్రీఫింగ్', trending: 'ట్రెండింగ్ వార్తలు', search: 'వార్తలు వెతకండి...' },
      common: { loading: 'లోడ్ అవుతోంది...', logout: 'లాగ్ అవుట్' },
    },
  },
  fr: {
    translation: {
      app: { name: 'Nexora', tagline: 'Assistant de Nouvelles Personnalisé par IA' },
      auth: { signIn: 'Se Connecter', signUp: 'Créer un Compte', email: 'Email', password: 'Mot de passe' },
      home: { briefing: "Briefing IA d'Aujourd'hui", trending: 'Actualités Tendances', search: 'Rechercher...' },
      common: { loading: 'Chargement...', logout: 'Déconnexion' },
    },
  },
  de: {
    translation: {
      app: { name: 'Nexora', tagline: 'KI-gestützter personalisierter Nachrichtenassistent' },
      auth: { signIn: 'Anmelden', signUp: 'Konto Erstellen', email: 'E-Mail', password: 'Passwort' },
      home: { briefing: 'Heutiges KI-Briefing', trending: 'Trendnachrichten', search: 'Nachrichten suchen...' },
      common: { loading: 'Laden...', logout: 'Abmelden' },
    },
  },
  ja: {
    translation: {
      app: { name: 'Nexora', tagline: 'AIパーソナライズドニュースアシスタント' },
      auth: { signIn: 'サインイン', signUp: 'アカウント作成', email: 'メール', password: 'パスワード' },
      home: { briefing: '今日のAIブリーフィング', trending: 'トレンドニュース', search: 'ニュースを検索...' },
      common: { loading: '読み込み中...', logout: 'ログアウト' },
    },
  },
  zh: {
    translation: {
      app: { name: 'Nexora', tagline: 'AI驱动的个性化新闻助手' },
      auth: { signIn: '登录', signUp: '创建账户', email: '邮箱', password: '密码' },
      home: { briefing: '今日AI简报', trending: '热门新闻', search: '搜索新闻...' },
      common: { loading: '加载中...', logout: '退出登录' },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
