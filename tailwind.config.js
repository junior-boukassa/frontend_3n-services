/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18221d',
        cream: '#f6f7f2',
        brand: {
          50: '#effaf5',
          100: '#d8f3e7',
          500: '#16a069',
          600: '#0c8154',
          700: '#096744',
          900: '#143a2c',
        },
      },
      boxShadow: { soft: '0 12px 35px rgba(20,58,44,.08)' },
    },
  },
  plugins: [],
};
