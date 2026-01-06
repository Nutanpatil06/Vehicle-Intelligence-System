import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/context/theme-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vehicle Intelligence",
  description: "Monitor and manage your vehicle's performance",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} theme-transition`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
