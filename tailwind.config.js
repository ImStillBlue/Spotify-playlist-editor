/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          'green-dark': '#1aa34a',
          black: '#121212',
          'dark-gray': '#181818',
          'light-gray': '#282828',
          'lighter-gray': '#404040',
          white: '#FFFFFF',
          'subdued': '#A7A7A7',
        }
      },
    },
  },
  plugins: [],
}
