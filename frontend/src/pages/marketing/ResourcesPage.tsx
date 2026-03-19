import { Link } from 'react-router-dom'
import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { BookOpen, FileText, BarChart3 } from 'lucide-react'

const placeholders = [
  {
    title: 'Lead quality playbook',
    desc: 'How to define ICP, disqualifiers, and handoff rules — article coming soon.',
    icon: BookOpen,
  },
  {
    title: 'Case study: pipeline in 90 days',
    desc: 'Placeholder for a customer story once approved for publication.',
    icon: BarChart3,
  },
  {
    title: 'Whitepaper: psychographics in B2B',
    desc: 'Gated asset — wire to your marketing automation when ready.',
    icon: FileText,
  },
]

export function ResourcesPage() {
  return (
    <MarketingPageShell
      title="Blog & resources"
      subtitle="Thought leadership, case studies, and downloadable guides. Replace these cards with your CMS or MDX content when ready."
    >
      <div className="grid md:grid-cols-3 gap-6">
        {placeholders.map((p) => (
          <article key={p.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <p.icon className="w-10 h-10 text-blue-600 mb-3" />
            <h2 className="font-semibold text-gray-900">{p.title}</h2>
            <p className="text-sm text-gray-600 mt-2 flex-1">{p.desc}</p>
            <span className="text-xs text-gray-400 mt-4">Coming soon</span>
          </article>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-gray-500">
        Want to be notified? <Link to="/signup" className="text-blue-600 font-medium">Create an account</Link> or{' '}
        <Link to="/forms/data-request" className="text-blue-600 font-medium">
          tell us what you need
        </Link>
        .
      </p>
    </MarketingPageShell>
  )
}
