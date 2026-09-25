/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0a0b',
          900: '#111113',
          800: '#18181b',
          700: '#232326',
          600: '#2e2e33',
        },
        flame: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#ffc9a8',
          300: '#ffa470',
          400: '#ff7a33',
          500: '#ff5c0a',
          600: '#f04100',
          700: '#c73302',
          800: '#9e2a09',
          900: '#7f250a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(255,92,10,0.45)',
        card: '0 4px 24px -4px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 50% 0%, rgba(255,92,10,0.12), transparent 60%)',
      },
    },
  },
  plugins: [],
};
