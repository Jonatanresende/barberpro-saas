/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./public/app.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand-gold': '#D4AF37',
        'brand-dark': '#111111',
        'brand-light': '#F5F5F5',
        'brand-gray': '#222222',
      },
    },
  },
  plugins: [],
}