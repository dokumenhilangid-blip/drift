/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#faf8f3',
        foreground: '#2a2620',
        surface: '#ffffff',
        'surface-subtle': '#f5f3f0',
        'surface-hover': '#efe9e0',
        'accent-primary': '#c9a876',
        'accent-secondary': '#8b7355',
        'accent-tertiary': '#d4a574',
        'accent-subtle': '#e8dcc8',
        'emotion-joy': '#d4b896',
        'emotion-calm': '#a8b8a8',
        'emotion-reflection': '#9b8b7e',
        'emotion-melancholy': '#8b9b9b',
        'emotion-energy': '#c9956f',
        border: '#e0d5c7',
        'border-subtle': '#f0ebe5',
        success: '#7a9b6f',
        warning: '#b8956f',
        error: '#a87070',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(42, 38, 32, 0.06)',
        'md': '0 4px 12px rgba(42, 38, 32, 0.08)',
        'lg': '0 12px 24px rgba(42, 38, 32, 0.1)',
        'xl': '0 20px 40px rgba(42, 38, 32, 0.12)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        display: ['2.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        heading: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        subheading: ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['1rem', { lineHeight: '1.7', fontWeight: '400' }],
        caption: ['0.875rem', { lineHeight: '1.5', fontWeight: '400', opacity: '0.85' }],
      },
      spacing: {
        'gutter-mobile': '20px',
        'gutter-desktop': '32px',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
