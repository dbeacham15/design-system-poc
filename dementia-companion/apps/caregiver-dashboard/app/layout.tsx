import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '../components/Providers'
import { DevAutoLogin } from '../components/DevAutoLogin'

export const metadata: Metadata = {
  title: 'Companion Caregiver Dashboard',
  description: 'Manage your loved one\'s AI companion',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Providers>
          <DevAutoLogin />
          {children}
        </Providers>
      </body>
    </html>
  )
}
