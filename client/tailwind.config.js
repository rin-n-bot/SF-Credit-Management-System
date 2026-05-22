/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#141414',
        accent: '#5b50e6',
        'text-dark': '#12172a',
        'text-medium': '#20263a',
        'text-muted': '#5f667a',
        'text-light': '#6b7280',
        'text-footer': '#8a91a3',
        border: '#dce0ea',
        error: '#d92d20',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}