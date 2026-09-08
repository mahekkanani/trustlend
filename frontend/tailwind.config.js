/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // TrustLend brand palette
        bg: {
          primary: '#08090a',
          secondary: '#0e1012',
          card: '#111416',
          elevated: '#161a1e',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.07)',
          active: 'rgba(255,255,255,0.10)',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.18)',
        },
        accent: {
          primary: '#5B8DEF',    // Institutional blue
          secondary: '#8B5CF6',  // Protocol purple
          gold: '#C9A84C',       // Premium gold
          green: '#34D399',      // Success green
          red: '#F87171',        // Risk red
          amber: '#FBBF24',      // Warning amber
        },
        text: {
          primary: '#F0F4F8',
          secondary: '#8C9BAB',
          muted: '#4A5568',
          accent: '#5B8DEF',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `
          linear-gradient(rgba(91,141,239,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(91,141,239,0.05) 1px, transparent 1px)
        `,
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(91,141,239,0.1)' },
          '100%': { boxShadow: '0 0 40px rgba(91,141,239,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-blue': '0 0 30px rgba(91,141,239,0.15)',
        'glow-purple': '0 0 30px rgba(139,92,246,0.15)',
        'glow-gold': '0 0 30px rgba(201,168,76,0.15)',
        'card': '0 1px 0 rgba(255,255,255,0.05), 0 -1px 0 rgba(0,0,0,0.2)',
      }
    },
  },
  plugins: [],
}
