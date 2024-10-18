/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./public/styles/**/*.css",
    "./public/scripts/**/*.js" // Asegúrate de que Tailwind busque en la ruta correcta
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
