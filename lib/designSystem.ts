export const UI = {
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px'
  },
  text: {
    xs: '0.7rem',
    sm: '0.82rem',
    md: '0.95rem',
    lg: '1.15rem',
    xl: '1.4rem'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  },
  colors: {
    card: 'rgba(255,255,255,0.03)',
    cardHover: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.15)',
    primary: 'var(--primary)',
    muted: 'var(--text-muted)',
    bgMain: 'var(--bg-dark)'
  },
  icons: {
    sm: 14,
    md: 18,
    lg: 22
  },
  button: {
    base: {
      padding: '10px 12px',
      borderRadius: '12px',
      fontSize: '0.82rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minHeight: '40px',
      cursor: 'pointer',
      fontWeight: 600,
      transition: 'all .2s ease',
      userSelect: 'none' as const
    },
    primary: {
      background: 'var(--accent-gradient)',
      border: 'none',
      color: 'white'
    },
    secondary: {
      background: 'rgba(255,255,255,.05)',
      border: '1px solid rgba(255,255,255,.1)',
      color: 'white'
    },
    ghost: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-muted)'
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      color: '#ef4444'
    },
    whatsapp: {
      background: '#25D36618',
      border: '1px solid rgba(37, 211, 102, 0.2)',
      color: '#25D366'
    }
  }
};
