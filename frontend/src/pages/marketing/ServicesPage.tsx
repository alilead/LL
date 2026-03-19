import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { ChevronDown, ChevronUp } from 'lucide-react'

const services = [
  {
    title: 'Qualified leads',
    body: 'Research-backed prospect lists and sequences matched to your ICP, with clear qualification criteria.',
  },
  {
    title: 'Psychometrics',
    body: 'Communication and personality insights to tailor outreach and improve meeting quality.',
  },
  {
    title: 'Verified contact details',
    body: 'Emails, phones, and social profiles validated to reduce bounce and protect sender reputation.',
  },
  {
    title: 'Higher sales conversion',
    body: 'Pipeline hygiene, stage definitions, and follow-up discipline baked into your workflow.',
  },
  {
    title: 'Client Relationship Manager (CRM)',
    body: 'Leads, activities, and history in one place — built for revenue teams, not IT science projects.',
  },
  {
    title: 'LinkedIn profiles (CSV)',
    body: 'Structured exports and enrichment options for outbound and ABM programs.',
  },
  {
    title: 'Calendar & task management',
    body: 'Keep next steps visible: calls, demos, and internal tasks tied to real opportunities.',
  },
  {
    title: 'Deal tracker',
    body: 'Forecast-friendly deal stages, values, and momentum so leadership sees the truth.',
  },
  {
    title: 'Web optimization & management',
    body: 'Landing experiences and forms that connect cleanly to your stack (where we support it).',
  },
  {
    title: 'Social media excellence',
    body: 'Guidance and assets to amplify wins and thought leadership without losing focus on pipeline.',
  },
]

export function ServicesPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <MarketingPageShell
      title="Services"
      subtitle="Everything we offer rolls up to one thing: predictable, qualified pipeline for your team."
    >
      <div className="space-y-3">
        {services.map((s, i) => {
          const isOpen = open === i
          return (
            <div key={s.title} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {s.title}
                {isOpen ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
              </button>
              {isOpen && <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">{s.body}</div>}
            </div>
          )
        })}
      </div>
      <p className="mt-8 text-center text-sm text-gray-500">
        Need a custom scope?{' '}
        <Link to="/forms/data-request" className="text-blue-600 font-medium">
          Request data
        </Link>{' '}
        or{' '}
        <Link to="/contact" className="text-blue-600 font-medium">
          contact us
        </Link>
        .
      </p>
    </MarketingPageShell>
  )
}
