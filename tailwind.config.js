/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — Teal (from Penpot #14ceca)
        teal: {
          DEFAULT: '#14ceca',
          dark: '#17b1af',
        },
        // Blue — Log In button (#016db9)
        blue: {
          brand: '#016db9',
        },
        // Magenta — Sign Up / social actions (#dd3ee3)
        magenta: {
          DEFAULT: '#dd3ee3',
          dark: '#a503ab',
        },
        // Background gradient colors (from Penpot)
        navy: {
          DEFAULT: '#000a29',   // base dark navy (gradient center)
          blue: '#091d5b',      // navy-blue tint (gradient start)
          purple: '#200a32',    // dark purple tint (gradient end)
          card: '#160a2f',      // card / panel background
          wine: '#29112d',      // auth card background
        },
        // Pink for destructive/sign-out
        pink: {
          brand: '#e05580',
        },
        gray: {
          muted: '#6b6969',
          medium: '#888887',
          light: '#c9c9c5',
          lighter: '#e9e9e9',
        },
        // Avatar highlight
        avatar: '#e3dda0',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '9999px',
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #091d5b 0%, #000a29 50%, #200a32 100%)',
      },
    },
  },
  plugins: [],
}
