/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    './public/**/*.html',
    './public/styles/**/*.css',
    './public/scripts/**/*.{js,jsx}', 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
