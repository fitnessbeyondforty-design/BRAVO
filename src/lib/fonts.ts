import { Cinzel, Inter, Playfair_Display } from 'next/font/google'

export const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '600', '700', '900'], variable: '--font-cinzel', display: 'swap' })
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
export const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap' })
