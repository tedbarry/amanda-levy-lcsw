module.exports = {
  content: ['./src/**/*.njk', './src/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d4dac9',
          300: '#b5c0a4',
          400: '#96a67e',
          500: '#7a8e63',
          600: '#60724d',
          700: '#4c5a3e',
          800: '#3f4a34',
          900: '#363f2e',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f0',
          200: '#faf3e0',
          300: '#f5e8c8',
          400: '#eddcab',
        },
        sky: {
          50: '#f0f7fa',
          100: '#dceef5',
          200: '#bddee9',
          300: '#8ec6d8',
          400: '#5dabc2',
        },
        warm: {
          50: '#fdf8f6',
          100: '#f9ede7',
          200: '#f3dace',
          300: '#e9bfa9',
          400: '#dba080',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
};
