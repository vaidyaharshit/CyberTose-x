/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      colors: {
        void: 'var(--color-void)',
        panel: 'var(--color-panel)',
        raise: 'var(--color-raise)',
        edge: 'var(--color-edge)',
        ink: 'var(--color-text)',
        dim: 'var(--color-dim)',
        faint: 'var(--color-faint)',
        cyanx: 'var(--color-cyanx)',
        violetx: 'var(--color-violetx)',
        goodx: 'var(--color-goodx)',
        warnx: 'var(--color-warnx)',
        badx: 'var(--color-badx)',
      },
      boxShadow: {
        glow: '0 0 24px -6px var(--glow-cyan)',
        'glow-violet': '0 0 24px -6px var(--glow-violet)',
        card: '0 10px 34px -18px rgba(0,0,0,0.6)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
        floaty: 'floaty 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};