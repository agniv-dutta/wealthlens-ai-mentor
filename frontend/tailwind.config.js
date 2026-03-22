module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50:  '#FDFAF4',
          100: '#F2EDD8',
          200: '#EDE6CC',
          300: '#E6DDBE',
          400: '#DDD8C0',
          500: '#C8C0A0',
        },
        forest: {
          900: '#1B5E20',
          700: '#388E3C',
          400: '#689F38',
          200: '#AED581',
          50:  '#DCEDC8',
        }
      },
      fontFamily: {
        display: ['DM Serif Display', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      }
    }
  },
  plugins: [],
}
