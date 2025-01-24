/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    './public/**/*.html',
    './public/styles/**/*.css',
    './public/scripts/**/*.{js,jsx}', 
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
