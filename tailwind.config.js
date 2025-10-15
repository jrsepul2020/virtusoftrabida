export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Aquí defines tu color personalizado
        'virtus-fondos': '#f3f1ed',
        'virtus-fondos-2': '#e8e3db',
        // Puedes nombrarlo como prefieras
        // Si Bolt.new tiene un color primario, lo definirías aquí también:
        // 'primary': {
        //   50: '#e0f2fe',
        //   100: '#bae6fd',
        //   // ... y así sucesivamente
        //   600: '#0284c7',
        // },
        primary: {
          50: '#f7f5f0',
          100: '#ebe6d9',
          200: '#d9cfb5',
          300: '#c4b38b',
          400: '#b39d6f',
          500: '#9B8658',
          600: '#8a754c',
          700: '#6f5e3e',
          800: '#5c4e35',
          900: '#4c412e',
        },
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
