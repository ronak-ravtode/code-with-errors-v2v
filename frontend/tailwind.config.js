/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Deep dark
        royal: '#6d28d9', // violet-700
        indigo: '#4f46e5', // indigo-600
        electric: '#3b82f6', // blue-500
        glass: 'rgba(255, 255, 255, 0.05)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',
        pinkAccent: '#ec4899', // pink-500
        emeraldLight: '#10b981', // emerald-500
        goldLight: '#f59e0b', // amber-500
        danger: '#ef4444', // red-500
        card: '#18181b', // zinc-900
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Outfit', 'Sora', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      animation: {
        'blob': 'blob 7s infinite',
        'aurora': 'aurora 15s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
