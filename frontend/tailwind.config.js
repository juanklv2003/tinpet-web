/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Landing brand tokens (unchanged) ──────────────────────
        brand: {
          DEFAULT: 'var(--tp-pink)',
          dark:    'var(--tp-pink-dark)',
          light:   'var(--tp-pink-light)',
          50:  '#FDF2F8',
          100: '#FCE7F3',
          500: '#B94188',
          600: '#c82d75',
          900: '#831843',
        },
        // ── Dashboard design system ────────────────────────────────
        surface:     '#FFFFFF',
        background:  '#fffdea',
        cream:       '#FDFBF4',
        ink: {
          light:  '#94A3B8',
          medium: '#475569',
          dark:   '#0F172A',
        },
        accent: {
          100: '#FEF3C7',
          500: '#F59E0B',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
        manrope: ['Manrope', 'ui-sans-serif', 'system-ui'],
        serif:   ['Lora', 'Georgia', 'ui-serif', 'serif'],
      },
      boxShadow: {
        'bento':       '0 10px 40px -10px rgba(15, 23, 42, 0.04)',
        'bento-hover': '0 20px 40px -10px rgba(15, 23, 42, 0.08)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bento-in': {
          '0%':   { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':        'fade-up 0.4s ease-out both',
        'scale-in':       'scale-in 0.25s ease-out both',
        'shimmer':        'shimmer 2s linear infinite',
        'bento-in':       'bento-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
