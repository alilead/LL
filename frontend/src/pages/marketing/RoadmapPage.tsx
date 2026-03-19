import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'

const milestones = [
  { period: 'Now', items: ['Core CRM, leads, deals, tasks', 'Psychometrics insights', 'Data request & diagnostic flows'] },
  { period: 'Next', items: ['Deeper calendar integrations', 'More export formats', 'Self-serve package toggles'] },
  { period: 'Exploring', items: ['Enterprise SSO', 'Regional data residency options', 'Partner marketplace'] },
]

export function RoadmapPage() {
  return (
    <MarketingPageShell
      title="Roadmap"
      subtitle="We ship in tight loops with customers. This page is a high-level view — details move as we learn."
    >
      <div className="space-y-8">
        {milestones.map((m) => (
          <div key={m.period} className="relative pl-8 border-l-2 border-blue-200">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
            <h2 className="text-lg font-semibold text-gray-900">{m.period}</h2>
            <ul className="mt-3 space-y-2 text-gray-600 text-sm">
              {m.items.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </MarketingPageShell>
  )
}
