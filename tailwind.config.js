/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1538',
        cream: '#F5F7FB',
        brand: {
          50: '#F5F8FF',
          100: '#EAF2FF',
          500: '#146CFF',
          600: '#0B45D8',
          700: '#0837B0',
          900: '#071B5C',
        },
      },
      boxShadow: { soft: '0 14px 40px rgba(7,27,92,.09)' },
    },
  },
  plugins: [],
};
