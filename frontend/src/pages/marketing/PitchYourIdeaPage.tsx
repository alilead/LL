import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { MarketingPageShell } from '../../components/marketing/MarketingPageShell'
import { submitMarketingForm } from '../../services/marketingFormsApi'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

/**
 * Inspired by agency-style “you pitch it, we build it” intake:
 * capture the idea, audience, constraints, and success criteria.
 */
export function PitchYourIdeaPage() {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [elevatorPitch, setElevatorPitch] = useState('')
  const [problemSolved, setProblemSolved] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [mustHaves, setMustHaves] = useState('')
  const [niceToHaves, setNiceToHaves] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [timeline, setTimeline] = useState('')
  const [links, setLinks] = useState('')
  const [whyLeadLab, setWhyLeadLab] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await submitMarketingForm({
        form_type: 'pitch_your_idea',
        full_name: fullName,
        email,
        company: company || undefined,
        phone: phone || undefined,
        subject: projectTitle || `Pitch — ${company || email}`,
        payload: {
          project_title: projectTitle,
          elevator_pitch: elevatorPitch,
          problem_solved: problemSolved,
          target_user: targetUser,
          must_have_features: mustHaves,
          nice_to_have: niceToHaves,
          budget_range: budgetRange,
          timeline,
          reference_links: links,
          why_the_lead_lab: whyLeadLab,
        },
      })
      toast.success('Pitch received! We will get back to you with questions or a proposed path.')
      setFullName('')
      setEmail('')
      setCompany('')
      setPhone('')
      setProjectTitle('')
      setElevatorPitch('')
      setProblemSolved('')
      setTargetUser('')
      setMustHaves('')
      setNiceToHaves('')
      setBudgetRange('')
      setTimeline('')
      setLinks('')
      setWhyLeadLab('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingPageShell
      title="Pitch your idea — we make it"
      subtitle="Share your product, workflow, or integration idea. We review feasibility and follow up like a focused product studio."
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
            <label className={labelClass}>Company / org</label>
            <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Working title *</label>
          <input
            className={inputClass}
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. Partner referral tracker for our sales team"
          />
        </div>
        <div>
          <label className={labelClass}>Elevator pitch (2–4 sentences) *</label>
          <textarea className={inputClass} rows={4} required value={elevatorPitch} onChange={(e) => setElevatorPitch(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>What problem does this solve? *</label>
          <textarea className={inputClass} rows={3} required value={problemSolved} onChange={(e) => setProblemSolved(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Who is the primary user?</label>
          <textarea className={inputClass} rows={2} value={targetUser} onChange={(e) => setTargetUser(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Must-have features / outcomes</label>
          <textarea className={inputClass} rows={3} value={mustHaves} onChange={(e) => setMustHaves(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Nice-to-have</label>
          <textarea className={inputClass} rows={2} value={niceToHaves} onChange={(e) => setNiceToHaves(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Budget range (optional)</label>
            <select className={inputClass} value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="under-5k">Under $5k</option>
              <option value="5k-25k">$5k – $25k</option>
              <option value="25k-100k">$25k – $100k</option>
              <option value="100k+">$100k+</option>
              <option value="enterprise">Enterprise / TBD</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Ideal timeline</label>
            <input className={inputClass} value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. MVP in 8 weeks" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Links (Figma, Notion, Loom, repo…)</label>
          <textarea className={inputClass} rows={2} value={links} onChange={(e) => setLinks(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Why The Lead Lab?</label>
          <textarea className={inputClass} rows={2} value={whyLeadLab} onChange={(e) => setWhyLeadLab(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all"
        >
          {loading ? 'Sending…' : 'Send pitch'}
        </button>
      </form>
    </MarketingPageShell>
  )
}
