import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AppInitializer from '@/components/AppInitializer'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { APP_NAME } from '@/lib/constants'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${APP_NAME} - Rent, Buy & Book Services`,
  description: 'A multi-functional marketplace for renting, selling, and service booking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppInitializer />
        <ConditionalLayout navbar={<Navbar />} footer={<Footer />}>
          {children}
        </ConditionalLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}


