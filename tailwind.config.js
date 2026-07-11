import { themeTokens } from './src/config/themeTokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: themeTokens.colors.ink,
        cream: themeTokens.colors.cream,
        line: themeTokens.colors.line,
        accent: {
          500: themeTokens.colors.accent[500],
        },
        night: {
          950: themeTokens.colors.night[950],
          900: themeTokens.colors.night[900],
          800: themeTokens.colors.night[800],
          700: themeTokens.colors.night[700],
          200: themeTokens.colors.night[200],
          50: themeTokens.colors.night[50],
        },
        brand: {
          50: themeTokens.colors.brand[50],
          100: themeTokens.colors.brand[100],
          500: themeTokens.colors.brand[500],
          600: themeTokens.colors.brand[600],
          700: themeTokens.colors.brand[700],
          900: themeTokens.colors.brand[900],
        },
      },
      boxShadow: { soft: themeTokens.shadows.soft },
    },
  },
  plugins: [],
};
