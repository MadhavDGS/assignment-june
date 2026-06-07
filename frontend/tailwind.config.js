/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#ffffff',
        gray: {
          400: '#9ca3af',
          500: '#6b7280',
        },
        primary: 'var(--accent-color)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        surface: 'var(--surface)',
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'monospace'],
        grotesk: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 10px var(--accent-color)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            textShadow: '0 0 5px var(--accent-color), 0 0 10px var(--accent-color), 0 0 20px var(--accent-color)',
          },
          '50%': {
            textShadow: '0 0 10px var(--accent-color), 0 0 20px var(--accent-color), 0 0 30px var(--accent-color)',
          },
        },
      },
    },
  },
  plugins: [],
}
