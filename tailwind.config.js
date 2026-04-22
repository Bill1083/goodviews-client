/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — Teal (from Penpot #17b1af / #14ceca)
        teal: {
          DEFAULT: '#17b1af',
          light: '#14ceca',
        },
        // Social accent — Pink/Magenta (from Penpot #ff1ebd)
        pink: {
          brand: '#ff1ebd',
        },
        // Dark mode purples (from Penpot #6011bf / #6911d4 / #771de5)
        purple: {
          dark: '#6011bf',
          DEFAULT: '#6911d4',
          light: '#771de5',
          muted: '#a378f3',
        },
        // Page backgrounds & deep navy (from Penpot #151035)
        navy: {
          DEFAULT: '#151035',
        },
        // Neutral grays (from Penpot design)
        gray: {
          muted: '#8f9da3',
          light: '#eeeeee',
          dark: '#030712',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
