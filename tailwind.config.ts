import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Antique gold — sampled from the Bravo logo lettering.
        // 600/700 are the text-on-ivory shades (≥ 4.5:1 on paper.50).
        gold: {
          50: '#FBF5EA', 100: '#F3E6CC', 200: '#E6CD9C',
          300: '#D6A35B', 400: '#C89854', 500: '#B98A49',
          600: '#8A6128', 700: '#7A5626', 800: '#5A3F1C', 900: '#3B2911',
        },
        // Deep teal-black — sampled from the logo field ("ink")
        teal: {
          50: '#E8EEEF', 100: '#C3D2D4', 200: '#8FAAAD', 300: '#5A8085',
          400: '#356065', 500: '#284549', 600: '#19353A', 700: '#0C2428',
          800: '#071A1D', 900: '#041113', 950: '#010202',
        },
        // Ivory paper — the almanac page
        paper: { 50: '#FAF8F3', 100: '#F4EFE4', 200: '#EAE2D1', 300: '#DCD1BA' },
        ink: { DEFAULT: '#0C2428', soft: '#3E5457', muted: '#5B6B6D' },
        silver: { 100: '#F2F2F0', 200: '#D7D7D7', 300: '#C7C7C3', 400: '#A6A6A6' },
      },
      fontFamily: {
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(200,152,84,.35), 0 8px 30px -12px rgba(200,152,84,.4)',
        plate: '0 1px 0 rgba(12,36,40,.04), 0 24px 48px -24px rgba(12,36,40,.35)',
        lift: '0 30px 60px -30px rgba(12,36,40,.45)',
      },
      keyframes: {
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'rise-in': { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'none' } },
        draw: { to: { strokeDashoffset: '0' } },
        glow: { '0%,100%': { opacity: '.45' }, '50%': { opacity: '.8' } },
      },
      animation: {
        'spin-slow': 'spin-slow 60s linear infinite',
        marquee: 'marquee 60s linear infinite',
        shimmer: 'shimmer 6s linear infinite',
        'rise-in': 'rise-in .9s cubic-bezier(.2,.7,.2,1) both',
        draw: 'draw 3s cubic-bezier(.6,0,.2,1) forwards',
        glow: 'glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
export default config
