import { motion } from 'framer-motion';

interface ParticleBackgroundProps {
  className?: string;
}

export function ParticleBackground({ className = '' }: ParticleBackgroundProps) {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-nexora-navy via-indigo-950 to-purple-950" />

      <motion.div
        className="absolute top-1/4 -left-1/4 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={i}
            x1={`${10 + i * 12}%`}
            y1="0%"
            x2={`${30 + i * 8}%`}
            y2="100%"
            stroke="url(#lineGrad)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </svg>
    </div>
  );
}

export function NexoraLogo({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 120 40"
      className={`h-10 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="20" cy="20" r="14"
        fill="none" stroke="url(#logoGrad)" strokeWidth="2"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '20px 20px' }}
      />
      <motion.circle
        cx="20" cy="20" r="6"
        fill="url(#logoGrad)"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <text x="42" y="27" fill="url(#logoGrad)" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="700">
        Nexora
      </text>
    </motion.svg>
  );
}
