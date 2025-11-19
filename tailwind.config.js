/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    // Busca en cualquier subcarpeta de public
    './public/**/*.{html,js,php}', 
    // Si tus archivos JS están en la raíz del proyecto (fuera de public), descomenta esto:
    // './*.{html,js,php}',
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {
      screens: {
        'md': '887px',
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
};