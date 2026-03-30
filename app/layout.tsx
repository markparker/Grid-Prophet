import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import Script from "next/script"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Grid Prophet - F1 2026 Prediction League",
  description:
    "Predict F1 2026 race results, pole positions, and the World Drivers' Championship with your friends.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-9N3F6MD78Z"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-9N3F6MD78Z');
            `}
          </Script>
        </head>
        <body className="font-sans antialiased min-h-screen bg-background text-foreground">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "oklch(0.17 0.005 260)",
                border: "1px solid oklch(0.27 0.005 260)",
                color: "oklch(0.96 0 0)",
              },
            }}
          />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
