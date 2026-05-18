'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Alerts', icon: '🔔' },
  { href: '/dashboard/patient', label: 'Patient', icon: '👤' },
  { href: '/dashboard/memories', label: 'Memories', icon: '🧠' },
  { href: '/dashboard/caregiver', label: 'Caregiver', icon: '⚙️' },
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-amber-900">Companion</h1>
        <p className="text-xs text-amber-600 mt-0.5">Caregiver Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
