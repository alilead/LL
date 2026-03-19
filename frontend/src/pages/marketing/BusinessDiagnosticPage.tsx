import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { submitMarketingForm } from '../../services/marketingFormsApi'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

export function BusinessDiagnosticPage() {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [industry, setIndustry] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [leadVolume, setLeadVolume] = useState('')
  const [biggestPain, setBiggestPain] = useState('')
  const [tools, setTools] = useState('')
  const [goals, setGoals] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await submitMarketingForm({
        form_type: 'business_diagnostic',
        full_name: fullName,
        email,
        company: company || undefined,
        phone: phone || undefined,
        subject: `Diagnostic — ${company || email}`,
        payload: {
          industry,
          team_size: teamSize,
          monthly_lead_volume: leadVolume,
          biggest_pain_point: biggestPain,
          current_tools: tools,
          twelve_month_goals: goals,
        },
      })
      toast.success('Thank you! We will review your responses and follow up shortly.')
      setFullName('')
      setEmail('')
      setCompany('')
      setPhone('')
      setIndustry('')
      setTeamSize('')
      setLeadVolume('')
      setBiggestPain('')
      setTools('')
      setGoals('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingPageShell
      title="Business Diagnostic"
      subtitle="Help us understand your sales and lead-generation context so we can recommend the right path forward."
    >
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full name *</label>
            <input className={inputClass} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Work email *</label>
            <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Industry / sector</label>
          <input className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. B2B SaaS, professional services" />
        </div>
        <div>
          <label className={labelClass}>Approx. sales & marketing team size</label>
          <select className={inputClass} value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
            <option value="">Select…</option>
            <option value="1">Just me (solopreneur)</option>
            <option value="2-5">2–5</option>
            <option value="6-20">6–20</option>
            <option value="21+">21+</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Rough monthly lead volume (inbound + outbound)</label>
          <input className={inputClass} value={leadVolume} onChange={(e) => setLeadVolume(e.target.value)} placeholder="e.g. 50 qualified conversations / month" />
        </div>
        <div>
          <label className={labelClass}>Biggest pain point today</label>
          <textarea className={inputClass} rows={3} value={biggestPain} onChange={(e) => setBiggestPain(e.target.value)} placeholder="Time on manual research, poor qualification, CRM hygiene, etc." />
        </div>
        <div>
          <label className={labelClass}>Tools you use today</label>
          <textarea className={inputClass} rows={2} value={tools} onChange={(e) => setTools(e.target.value)} placeholder="CRM, LinkedIn, spreadsheets, other…" />
        </div>
        <div>
          <label className={labelClass}>Goals for the next 12 months</label>
          <textarea className={inputClass} rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all"
        >
          {loading ? 'Sending…' : 'Submit diagnostic'}
        </button>
      </form>
    </MarketingPageShell>
  )
}
