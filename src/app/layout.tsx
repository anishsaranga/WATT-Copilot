import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WATT Grid Co-Pilot',
  description: 'Mission-critical grid operations interface',
}

// Reads persisted theme from localStorage before first paint to avoid flash.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('watt-ui-store')||'{}');var t=(s.state&&s.state.theme)||'dark';document.documentElement.dataset.theme=t;if(t==='dark')document.documentElement.classList.add('dark');}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.classList.add('dark');}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* suppressHydrationWarning silences the React 19 "script not executed"
            dev warning — the script runs during SSR before hydration, which is
            exactly what anti-FOUC theme init requires. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
      </head>
      <body
        className="overflow-hidden h-screen bg-[var(--bg-primary)]"
        suppressHydrationWarning
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
