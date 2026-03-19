import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { submitMarketingForm } from '../../services/marketingFormsApi'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

export function DataRequestPage() {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [dataType, setDataType] = useState('')
  const [geography, setGeography] = useState('')
  const [volume, setVolume] = useState('')
  const [criteria, setCriteria] = useState('')
  const [useCase, setUseCase] = useState('')
  const [timeline, setTimeline] = useState('')
  const [compliance, setCompliance] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await submitMarketingForm({
        form_type: 'data_request',
        full_name: fullName,
        email,
        company: company || undefined,
        phone: phone || undefined,
        subject: `Data request — ${dataType || company || email}`,
        payload: {
          data_type: dataType,
          geography,
          expected_volume: volume,
          targeting_criteria: criteria,
          use_case: useCase,
          timeline,
          compliance_notes: compliance,
        },
      })
      toast.success('Request received. Our team will confirm scope and next steps.')
      setFullName('')
      setEmail('')
      setCompany('')
      setPhone('')
      setDataType('')
      setGeography('')
      setVolume('')
      setCriteria('')
      setUseCase('')
      setTimeline('')
      setCompliance('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingPageShell
      title="Data Request"
      subtitle="Tell us what verified data or lead lists you need. We will respond with feasibility, sample structure, and engagement options."
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
          <label className={labelClass}>Type of data / list *</label>
          <input
            className={inputClass}
            required
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            placeholder="e.g. decision-makers in fintech, EU, with verified emails"
          />
        </div>
        <div>
          <label className={labelClass}>Geography</label>
          <input className={inputClass} value={geography} onChange={(e) => setGeography(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Expected volume</label>
          <input className={inputClass} value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="e.g. 500 contacts, 10k companies" />
        </div>
        <div>
          <label className={labelClass}>Targeting criteria (titles, company size, tech stack, etc.)</label>
          <textarea className={inputClass} rows={4} value={criteria} onChange={(e) => setCriteria(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Use case</label>
          <textarea className={inputClass} rows={2} value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="Outbound, ABM, event invite, research…" />
        </div>
        <div>
          <label className={labelClass}>Timeline</label>
          <input className={inputClass} value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. needed by end of quarter" />
        </div>
        <div>
          <label className={labelClass}>Compliance / privacy requirements</label>
          <textarea className={inputClass} rows={2} value={compliance} onChange={(e) => setCompliance(e.target.value)} placeholder="GDPR, industry-specific rules, DPA needs…" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all"
        >
          {loading ? 'Sending…' : 'Submit data request'}
        </button>
      </form>
    </MarketingPageShell>
  )
}
