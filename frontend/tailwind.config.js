/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-main': '#F7F5F0',
        'brand-panel': '#FFFDF8',
        'brand-elevated': '#F1ECE3',
        'brand-border': '#DDD4C7',
        'brand-text': '#3E352C',
        'brand-text-sm': '#6F655A',
        'brand-muted': '#9A9084',
        'brand-gold': '#C9A646',
        'brand-sage': '#8FA68E',
        'brand-blue': '#8EA3B5',
        'brand-terra': '#C98B73',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}