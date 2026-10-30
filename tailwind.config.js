/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linen: '#F3EDE2',
        'linen-deep': '#E8DFCF',
        petrol: '#1E5560',
        'baby-pink': '#F5C6D2',
        tangerine: '#FF8A3D',
        'black-cherry': '#3B0F20',
        'cool-blue': '#5B8EF2',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
        'pill': '9999px',
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '20px',
        'xl': '28px',
        '2xl': '44px',
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(59, 15, 32, 0.04)',
        'float': '0 8px 30px rgba(59, 15, 32, 0.08)',
      }
    },
  },
  plugins: [],
}
