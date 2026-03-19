import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { Link } from 'react-router-dom'
import { Target, Heart, Users } from 'lucide-react'

export function AboutPage() {
  return (
    <MarketingPageShell
      title="About The Lead Lab"
      subtitle="We connect businesses with qualified leads through data, tooling, and a disciplined go-to-market approach."
    >
      <div className="space-y-12 text-gray-700">
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Our story</h2>
          <p className="leading-relaxed mb-4">
            The Lead Lab was built for teams that are tired of vanity metrics and empty inboxes. We combine verified data,
            psychographic insight, and practical CRM workflows so sales and marketing stay aligned from first touch to closed
            revenue.
          </p>
          <p className="leading-relaxed">
            <strong>Mission:</strong> make high-quality pipeline accessible to growing companies — not only enterprises with
            huge research teams. <strong>Vision:</strong> become the most trusted layer between your ICP and your calendar.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <Target className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Precision</h3>
            <p className="text-sm">Targeting and qualification that reflect how you actually sell — not generic lists.</p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <Heart className="w-10 h-10 text-rose-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Partnership</h3>
            <p className="text-sm">We invest in outcomes: meetings booked, pipeline created, and CRMs people actually use.</p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <Users className="w-10 h-10 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Team</h3>
            <p className="text-sm">Specialists across data, product, and revenue operations — add your leadership bios here.</p>
          </div>
        </section>

        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Why choose us?</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
            <li>Qualified leads aligned to your ICP — not spray-and-pray</li>
            <li>Psychometrics and messaging cues where they help, not hype</li>
            <li>Verified contact data with clear sourcing and compliance posture</li>
            <li>CRM, tasks, deals, and calendar in one coherent workspace</li>
          </ul>
          <Link to="/contact" className="inline-block mt-6 text-blue-600 font-medium hover:underline">
            Talk to us →
          </Link>
        </section>
      </div>
    </MarketingPageShell>
  )
}
