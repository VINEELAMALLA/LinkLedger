import type { Metadata } from "next"
import { Space_Grotesk, Source_Serif_4 } from "next/font/google"
import "./globals.css"

const headlineFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["500", "700"],
})

const bodyFont = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600"],
})

export const metadata: Metadata = {
  title: "Deadline Guard",
  description: "Organize saved social posts into internships, courses, theory concepts, and deadline alerts.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${headlineFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}