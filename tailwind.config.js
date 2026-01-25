/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        'virtus-fondos': '#f3f1ed',
        'virtus-fondos-2': '#e8e3db',
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#000',
          900: '#7f1d1d',
        },
        midnight: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          500: '#1e293b',
          600: '#0f172a',
          900: '#020617',
        },
        champagne: {
          50: '#fdfcf7',
          100: '#f9f6e9',
          200: '#f1ebd1',
          300: '#e5d9a8',
          400: '#d5c073',
          500: '#c5a059',
          600: '#b08b49',
          700: '#93713d',
          800: '#7a5d37',
          900: '#654d31',
        }
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'pop-in': { '0%': { opacity: 0, transform: 'scale(0.9)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'slide-in-left': { '0%': { transform: 'translateX(-50px)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
      },
      animation: {
        'fade-in': 'fade-in 1s ease forwards',
        'pop-in': 'pop-in 0.8s ease forwards',
        'slide-in-left': 'slide-in-left 1s ease forwards',
      },
      transitionDelay: {
        500: '0.5s',
        700: '0.7s',
        900: '0.9s',
      },
    },
  },
  plugins: [],
};