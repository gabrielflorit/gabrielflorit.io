/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lightest: '#F6D6BD',
        light: '#A79588',
        dark: '#575553',
        darkest: '#08141E',
      },
      fontFamily: {
        mono: ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
}
