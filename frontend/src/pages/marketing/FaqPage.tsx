import { useState } from 'react'
import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    q: 'What makes a lead “qualified” for The Lead Lab?',
    a: 'We align on your ICP, disqualifiers, and proof points (e.g. role, region, company size, tech signals). Lists and workflows are scored against that rubric — not generic “job title” matches alone.',
  },
  {
    q: 'Do you replace our CRM?',
    a: 'We provide a full CRM experience inside LeadLab for many teams. You can also use exports and integrations depending on your plan and roadmap.',
  },
  {
    q: 'How do you handle data privacy?',
    a: 'We treat contact data according to your agreements and applicable regulations. Use the Data Request form to specify GDPR or industry-specific needs.',
  },
  {
    q: 'Can we try before we buy?',
    a: 'Book a demo via Calendly from the header. We often run a focused pilot around a single segment or region.',
  },
  {
    q: 'What is “Pitch your idea”?',
    a: 'If you want a custom workflow, integration, or product slice, submit the pitch form. We respond like a product studio with clarifying questions and a proposed path.',
  },
]

export function FaqPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <MarketingPageShell title="FAQ" subtitle="Quick answers about how we work with revenue teams.">
      <div className="space-y-2">
        {faqs.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="bg-white rounded-xl border border-gray-200">
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-gray-900"
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {item.q}
                {isOpen ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
              </button>
              {isOpen && <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>}
            </div>
          )
        })}
      </div>
    </MarketingPageShell>
  )
}
