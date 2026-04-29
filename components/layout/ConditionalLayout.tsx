'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface ConditionalLayoutProps {
  children: ReactNode
  navbar: ReactNode
  footer: ReactNode
}

export default function ConditionalLayout({ children, navbar, footer }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')
  const isDashboardPage =
    pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/provider')

  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>
  }

  if (isDashboardPage) {
    return <>{children}</>
  }

  return (
    <>
      {navbar}
      <main>{children}</main>
      {footer}
    </>
  )
}
