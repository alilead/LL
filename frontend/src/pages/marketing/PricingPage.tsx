import { Link } from 'react-router-dom'
import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { Check } from 'lucide-react'

const tiers = [
  {
    name: 'Solopreneurs',
    price: 'From $X / mo',
    blurb: 'Core lead workspace for individual operators.',
    features: ['Lead inbox & basic CRM', 'Tasks & calendar hooks', 'Email support'],
    popular: false,
  },
  {
    name: 'Sales package',
    price: 'From $X / mo',
    blurb: 'For small teams running coordinated outbound.',
    features: ['Everything in Solopreneurs', 'Team seats', 'Imports & tagging', 'Priority email'],
    popular: true,
  },
  {
    name: 'SME',
    price: 'Custom',
    blurb: 'Scaling teams with data volume and workflows.',
    features: ['Advanced targeting', 'Psychometrics add-ons', 'Deal pipeline', 'Onboarding call'],
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'Quote',
    blurb: 'Security, SLAs, and custom integrations.',
    features: ['Dedicated success', 'Custom data contracts', 'SSO / governance (roadmap)', 'Volume pricing'],
    popular: false,
  },
]

const comparison = [
  { feature: 'Qualified lead lists', s: '✓', sales: '✓', sme: '✓', ent: '✓' },
  { feature: 'CRM & deals', s: '✓', sales: '✓', sme: '✓', ent: '✓' },
  { feature: 'Psychometrics', s: '—', sales: 'Add-on', sme: '✓', ent: '✓' },
  { feature: 'Dedicated CSM', s: '—', sales: '—', sme: 'Optional', ent: '✓' },
]

export function PricingPage() {
  return (
    <MarketingPageShell
      title="Pricing & packages"
      subtitle="Transparent tiers with room to grow. Replace placeholder prices with your live numbers in the codebase or CMS."
    >
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border p-6 flex flex-col ${t.popular ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : 'border-gray-200 bg-white shadow-sm'}`}
          >
            {t.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{t.name}</h2>
            <p className="text-2xl font-bold text-blue-600 mt-2">{t.price}</p>
            <p className="text-sm text-gray-600 mt-2 flex-1">{t.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-6 block text-center py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              Get started
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-semibold p-4 border-b">Feature comparison</h2>
        <table className="w-full text-sm text-left min-w-[480px]">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 font-medium">Feature</th>
              <th className="p-3 font-medium">Solo</th>
              <th className="p-3 font-medium">Sales</th>
              <th className="p-3 font-medium">SME</th>
              <th className="p-3 font-medium">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.feature} className="border-b last:border-0">
                <td className="p-3 text-gray-700">{row.feature}</td>
                <td className="p-3">{row.s}</td>
                <td className="p-3">{row.sales}</td>
                <td className="p-3">{row.sme}</td>
                <td className="p-3">{row.ent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 text-center bg-indigo-50 rounded-2xl p-8 border border-indigo-100">
        <h2 className="text-lg font-semibold text-gray-900">Enterprise & custom builds</h2>
        <p className="text-gray-600 mt-2 max-w-xl mx-auto">
          Large deployments, custom data sources, or compliance reviews — request a quote and we will scope with your team.
        </p>
        <Link
          to="/contact"
          className="inline-block mt-4 px-6 py-3 rounded-xl font-medium bg-gray-900 text-white hover:bg-gray-800"
        >
          Request a quote
        </Link>
      </div>
    </MarketingPageShell>
  )
}
