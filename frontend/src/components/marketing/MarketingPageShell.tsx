import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MarketingNav } from './MarketingNav'

export function MarketingPageShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      <MarketingNav />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
            {subtitle && <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
          </header>
          {children}
        </div>
      </main>
      <footer className="border-t bg-white/80 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} The Lead Lab. All rights reserved.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          <Link to="/legal" className="hover:text-blue-600">
            Legal
          </Link>
          <Link to="/contact" className="hover:text-blue-600">
            Contact
          </Link>
          <Link to="/signin" className="hover:text-blue-600">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
