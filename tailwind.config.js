/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8EDF4',
          100: '#C5D1E3',
          200: '#8FA3C7',
          300: '#5975AB',
          400: '#3A5A8A',
          500: '#1B3A5C',
          600: '#16304D',
          700: '#11263E',
          800: '#0C1C2F',
          900: '#071220',
        },
        gold: {
          50: '#FBF6E9',
          100: '#F5EACC',
          200: '#EDD9A0',
          300: '#E4C774',
          400: '#DDB858',
          500: '#D4A843',
          600: '#B8913A',
          700: '#9A7931',
          800: '#7C6128',
          900: '#5E4A1F',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
          idle: '#9CA3AF',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
