import type { Metadata, Viewport } from 'next'
import './globals.css'
import { cinzel, inter, playfair } from '@/lib/fonts'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { RevealObserver } from '@/components/motion/RevealObserver'

export const metadata: Metadata = {
  title: { default: 'Bravo International Book of World Records', template: '%s — Bravo World Records' },
  description: 'The official registry of verified extraordinary human achievement — records in arts, academics, sports, social work and extraordinary skills, documented and certified.',
  metadataBase: new URL('https://bravoworldrecords.com'),
  openGraph: { siteName: 'Bravo International Book of World Records', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#0C2428' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables scroll-reveal styles only when JS runs, so content is never hidden without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-screen bg-paper-50 font-sans text-ink antialiased">
        <SiteHeader />
        <div id="main" tabIndex={-1} className="outline-none">{children}</div>
        <SiteFooter />
        <RevealObserver />
      </body>
    </html>
  )
}
