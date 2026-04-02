import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { submitMarketingForm } from '../services/marketingFormsApi'
import { inputClass, labelClass } from '../components/intake/intakeFieldClasses'

const SLUGS = ['business-diagnostic', 'data-request', 'pitch-your-idea'] as const
type IntakeSlug = (typeof SLUGS)[number]

function isIntakeSlug(s: string | undefined): s is IntakeSlug {
  return !!s && (SLUGS as readonly string[]).includes(s)
}

export function IntakeFormPage() {
  const { formSlug } = useParams<{ formSlug: string }>()
  const slug = isIntakeSlug(formSlug) ? formSlug : null

  const [step, setStep] = useState<'form' | 'nda' | 'success'>('form')

  const [bdLoading, setBdLoading] = useState(false)
  const [bdFullName, setBdFullName] = useState('')
  const [bdEmail, setBdEmail] = useState('')
  const [bdCompany, setBdCompany] = useState('')
  const [bdPhone, setBdPhone] = useState('')
  const [bdIndustry, setBdIndustry] = useState('')
  const [bdTeamSize, setBdTeamSize] = useState('')
  const [bdLeadVolume, setBdLeadVolume] = useState('')
  const [bdBiggestPain, setBdBiggestPain] = useState('')
  const [bdTools, setBdTools] = useState('')
  const [bdGoals, setBdGoals] = useState('')

  const [drLoading, setDrLoading] = useState(false)
  const [drFullName, setDrFullName] = useState('')
  const [drEmail, setDrEmail] = useState('')
  const [drCompany, setDrCompany] = useState('')
  const [drPhone, setDrPhone] = useState('')
  const [drDataType, setDrDataType] = useState('')
  const [drGeography, setDrGeography] = useState('')
  const [drVolume, setDrVolume] = useState('')
  const [drCriteria, setDrCriteria] = useState('')
  const [drUseCase, setDrUseCase] = useState('')
  const [drTimeline, setDrTimeline] = useState('')
  const [drCompliance, setDrCompliance] = useState('')

  const [piLoading, setPiLoading] = useState(false)
  const [piFullName, setPiFullName] = useState('')
  const [piEmail, setPiEmail] = useState('')
  const [piCompany, setPiCompany] = useState('')
  const [piPhone, setPiPhone] = useState('')
  const [piProjectTitle, setPiProjectTitle] = useState('')
  const [piElevatorPitch, setPiElevatorPitch] = useState('')
  const [piProblemSolved, setPiProblemSolved] = useState('')
  const [piTargetUser, setPiTargetUser] = useState('')
  const [piMustHaves, setPiMustHaves] = useState('')
  const [piNiceToHaves, setPiNiceToHaves] = useState('')
  const [piBudgetRange, setPiBudgetRange] = useState('')
  const [piTimeline, setPiTimeline] = useState('')
  const [piLinks, setPiLinks] = useState('')
  const [piWhyLeadLab, setPiWhyLeadLab] = useState('')

  const [ndaAccepted, setNdaAccepted] = useState(false)
  const [ndaSignature, setNdaSignature] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, slug])

  const titleForSlug: Record<IntakeSlug, string> = {
    'business-diagnostic': 'Business diagnostic',
    'data-request': 'Data request',
    'pitch-your-idea': 'Pitch your idea',
  }

  const continueFromForm = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    setStep('nda')
  }

  const onSubmitBusinessDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ndaAccepted || !ndaSignature.trim()) {
      toast.error('Please accept the NDA and type your signature.')
      return
    }
    setBdLoading(true)
    try {
      await submitMarketingForm({
        form_type: 'business_diagnostic',
        full_name: bdFullName,
        email: bdEmail,
        company: bdCompany || undefined,
        phone: bdPhone || undefined,
        subject: `Diagnostic — ${bdCompany || bdEmail}`,
        payload: {
          industry: bdIndustry,
          team_size: bdTeamSize,
          monthly_lead_volume: bdLeadVolume,
          biggest_pain_point: bdBiggestPain,
          current_tools: bdTools,
          twelve_month_goals: bdGoals,
          nda_accepted: ndaAccepted,
          nda_signature: ndaSignature,
          nda_signed_at: new Date().toISOString(),
        },
      })
      setStep('success')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setBdLoading(false)
    }
  }

  const onSubmitDataRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ndaAccepted || !ndaSignature.trim()) {
      toast.error('Please accept the NDA and type your signature.')
      return
    }
    setDrLoading(true)
    try {
      await submitMarketingForm({
        form_type: 'data_request',
        full_name: drFullName,
        email: drEmail,
        company: drCompany || undefined,
        phone: drPhone || undefined,
        subject: `Data request — ${drDataType || drCompany || drEmail}`,
        payload: {
          data_type: drDataType,
          geography: drGeography,
          expected_volume: drVolume,
          targeting_criteria: drCriteria,
          use_case: drUseCase,
          timeline: drTimeline,
          compliance_notes: drCompliance,
          nda_accepted: ndaAccepted,
          nda_signature: ndaSignature,
          nda_signed_at: new Date().toISOString(),
        },
      })
      setStep('success')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setDrLoading(false)
    }
  }

  const onSubmitPitchYourIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ndaAccepted || !ndaSignature.trim()) {
      toast.error('Please accept the NDA and type your signature.')
      return
    }
    setPiLoading(true)
    try {
      await submitMarketingForm({
        form_type: 'pitch_your_idea',
        full_name: piFullName,
        email: piEmail,
        company: piCompany || undefined,
        phone: piPhone || undefined,
        subject: piProjectTitle || `Pitch — ${piCompany || piEmail}`,
        payload: {
          project_title: piProjectTitle,
          elevator_pitch: piElevatorPitch,
          problem_solved: piProblemSolved,
          target_user: piTargetUser,
          must_have_features: piMustHaves,
          nice_to_have: piNiceToHaves,
          budget_range: piBudgetRange,
          timeline: piTimeline,
          reference_links: piLinks,
          why_the_lead_lab: piWhyLeadLab,
          nda_accepted: ndaAccepted,
          nda_signature: ndaSignature,
          nda_signed_at: new Date().toISOString(),
        },
      })
      setStep('success')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setPiLoading(false)
    }
  }

  if (!slug) {
    return <Navigate to="/intake" replace />
  }

  const ndaBlock = (
    <div className="border-t pt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">NDA</h4>
      <p className="text-sm text-gray-600 mb-4">
        We may send a formal NDA by email for signature as we scope next steps. Please confirm provisional agreement and
        type your name below to submit this intake.
      </p>
      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={ndaAccepted}
          onChange={(e) => setNdaAccepted(e.target.checked)}
          className="mt-1"
        />
        <span>I agree and authorize The Lead Lab to contact me about this request and next steps.</span>
      </label>
      <div className="mt-4">
        <label className={labelClass}>Signature (type your full name) *</label>
        <input
          className={inputClass}
          value={ndaSignature}
          onChange={(e) => setNdaSignature(e.target.value)}
          placeholder="e.g. Jane Doe"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <MarketingNav />
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/intake"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to options
          </Link>

          {step === 'success' ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-10 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 mb-6">
                <CheckCircle className="h-9 w-9" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Thank you for submitting</h1>
              <p className="text-gray-600 leading-relaxed max-w-lg mx-auto mb-2">
                We received your details. Our team will review your request and follow up by email. Depending on scope,
                we may send a formal NDA and scheduling options.
              </p>
              <p className="text-sm text-gray-500 mb-8">Please allow a short time for us to respond.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/"
                  className="inline-flex justify-center px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Back to home
                </Link>
                <Link
                  to="/intake"
                  className="inline-flex justify-center px-6 py-3 rounded-xl font-medium border border-gray-300 text-gray-800 hover:border-blue-400"
                >
                  Submit another request
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{titleForSlug[slug]}</h1>
              <p className="text-gray-600 mb-8">
                {step === 'form'
                  ? 'Fill in the details below. On the next step you will review and sign the NDA acknowledgment before we receive your submission.'
                  : 'Review and complete the NDA step, then submit.'}
              </p>

              {step === 'form' && slug === 'business-diagnostic' && (
                <form
                  onSubmit={continueFromForm}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900">Your business context</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full name *</label>
                      <input
                        className={inputClass}
                        required
                        value={bdFullName}
                        onChange={(e) => setBdFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Work email *</label>
                      <input
                        className={inputClass}
                        type="email"
                        required
                        value={bdEmail}
                        onChange={(e) => setBdEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Company</label>
                      <input className={inputClass} value={bdCompany} onChange={(e) => setBdCompany(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input className={inputClass} type="tel" value={bdPhone} onChange={(e) => setBdPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Industry / sector</label>
                    <input
                      className={inputClass}
                      value={bdIndustry}
                      onChange={(e) => setBdIndustry(e.target.value)}
                      placeholder="e.g. B2B SaaS, professional services"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Team size</label>
                      <select className={inputClass} value={bdTeamSize} onChange={(e) => setBdTeamSize(e.target.value)}>
                        <option value="">Select…</option>
                        <option value="1">Just me (solopreneur)</option>
                        <option value="2-5">2–5</option>
                        <option value="6-20">6–20</option>
                        <option value="21+">21+</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Monthly lead volume (approx.)</label>
                      <input
                        className={inputClass}
                        value={bdLeadVolume}
                        onChange={(e) => setBdLeadVolume(e.target.value)}
                        placeholder="e.g. 50 qualified conversations / month"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Biggest pain point today</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={bdBiggestPain}
                      onChange={(e) => setBdBiggestPain(e.target.value)}
                      placeholder="Time on manual research, poor qualification, CRM hygiene, etc."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tools you use today</label>
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={bdTools}
                      onChange={(e) => setBdTools(e.target.value)}
                      placeholder="CRM, LinkedIn, spreadsheets, other…"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Goals for the next 12 months</label>
                    <textarea className={inputClass} rows={3} value={bdGoals} onChange={(e) => setBdGoals(e.target.value)} />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Continue to NDA
                  </button>
                </form>
              )}

              {step === 'form' && slug === 'data-request' && (
                <form
                  onSubmit={continueFromForm}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900">Your data request</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full name *</label>
                      <input
                        className={inputClass}
                        required
                        value={drFullName}
                        onChange={(e) => setDrFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Work email *</label>
                      <input
                        className={inputClass}
                        type="email"
                        required
                        value={drEmail}
                        onChange={(e) => setDrEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Company</label>
                      <input className={inputClass} value={drCompany} onChange={(e) => setDrCompany(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input className={inputClass} type="tel" value={drPhone} onChange={(e) => setDrPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Type of data / list *</label>
                    <input
                      className={inputClass}
                      required
                      value={drDataType}
                      onChange={(e) => setDrDataType(e.target.value)}
                      placeholder="e.g. decision-makers in fintech, EU, with verified emails"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Geography</label>
                      <input className={inputClass} value={drGeography} onChange={(e) => setDrGeography(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Expected volume</label>
                      <input
                        className={inputClass}
                        value={drVolume}
                        onChange={(e) => setDrVolume(e.target.value)}
                        placeholder="e.g. 500 contacts, 10k companies"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Targeting criteria</label>
                    <textarea className={inputClass} rows={4} value={drCriteria} onChange={(e) => setDrCriteria(e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Use case</label>
                      <textarea
                        className={inputClass}
                        rows={2}
                        value={drUseCase}
                        onChange={(e) => setDrUseCase(e.target.value)}
                        placeholder="Outbound, ABM, research…"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Timeline</label>
                      <input
                        className={inputClass}
                        value={drTimeline}
                        onChange={(e) => setDrTimeline(e.target.value)}
                        placeholder="e.g. needed by end of quarter"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Compliance / privacy requirements</label>
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={drCompliance}
                      onChange={(e) => setDrCompliance(e.target.value)}
                      placeholder="GDPR, industry-specific rules, DPA needs…"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Continue to NDA
                  </button>
                </form>
              )}

              {step === 'form' && slug === 'pitch-your-idea' && (
                <form
                  onSubmit={continueFromForm}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900">Pitch your idea</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full name *</label>
                      <input className={inputClass} required value={piFullName} onChange={(e) => setPiFullName(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Work email *</label>
                      <input
                        className={inputClass}
                        type="email"
                        required
                        value={piEmail}
                        onChange={(e) => setPiEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Company / org</label>
                      <input className={inputClass} value={piCompany} onChange={(e) => setPiCompany(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input className={inputClass} type="tel" value={piPhone} onChange={(e) => setPiPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Working title *</label>
                    <input
                      className={inputClass}
                      required
                      value={piProjectTitle}
                      onChange={(e) => setPiProjectTitle(e.target.value)}
                      placeholder="e.g. Partner referral tracker for our sales team"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Elevator pitch (2–4 sentences) *</label>
                    <textarea
                      className={inputClass}
                      rows={4}
                      required
                      value={piElevatorPitch}
                      onChange={(e) => setPiElevatorPitch(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>What problem does this solve? *</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      required
                      value={piProblemSolved}
                      onChange={(e) => setPiProblemSolved(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Who is the primary user?</label>
                    <textarea className={inputClass} rows={2} value={piTargetUser} onChange={(e) => setPiTargetUser(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Must-have features / outcomes</label>
                    <textarea className={inputClass} rows={3} value={piMustHaves} onChange={(e) => setPiMustHaves(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Nice-to-have</label>
                    <textarea className={inputClass} rows={2} value={piNiceToHaves} onChange={(e) => setPiNiceToHaves(e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Budget range (optional)</label>
                      <select className={inputClass} value={piBudgetRange} onChange={(e) => setPiBudgetRange(e.target.value)}>
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
                      <input
                        className={inputClass}
                        value={piTimeline}
                        onChange={(e) => setPiTimeline(e.target.value)}
                        placeholder="e.g. MVP in 8 weeks"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Links (Figma, Notion, Loom, repo…)</label>
                    <textarea className={inputClass} rows={2} value={piLinks} onChange={(e) => setPiLinks(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Why The Lead Lab?</label>
                    <textarea className={inputClass} rows={2} value={piWhyLeadLab} onChange={(e) => setPiWhyLeadLab(e.target.value)} />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all"
                  >
                    Continue to NDA
                  </button>
                </form>
              )}

              {step === 'nda' && slug === 'business-diagnostic' && (
                <form
                  onSubmit={onSubmitBusinessDiagnostic}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900">Review & submit</h2>
                  <p className="text-sm text-gray-600">
                    You are about to submit as <strong>{bdFullName}</strong> ({bdEmail}).
                  </p>
                  {ndaBlock}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNdaAccepted(false)
                        setNdaSignature('')
                        setStep('form')
                      }}
                      className="flex-1 py-3 rounded-xl font-medium border border-gray-300 text-gray-800 hover:bg-gray-50"
                    >
                      Back to form
                    </button>
                    <button
                      type="submit"
                      disabled={bdLoading}
                      className="flex-1 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                    >
                      {bdLoading ? 'Sending…' : 'Submit request'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'nda' && slug === 'data-request' && (
                <form
                  onSubmit={onSubmitDataRequest}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900">Review & submit</h2>
                  <p className="text-sm text-gray-600">
                    You are about to submit as <strong>{drFullName}</strong> ({drEmail}).
                  </p>
                  {ndaBlock}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNdaAccepted(false)
                        setNdaSignature('')
                        setStep('form')
                      }}
                      className="flex-1 py-3 rounded-xl font-medium border border-gray-300 text-gray-800 hover:bg-gray-50"
                    >
                      Back to form
                    </button>
                    <button
                      type="submit"
                      disabled={drLoading}
                      className="flex-1 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                    >
                      {drLoading ? 'Sending…' : 'Submit request'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'nda' && slug === 'pitch-your-idea' && (
                <form
                  onSubmit={onSubmitPitchYourIdea}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900">Review & submit</h2>
                  <p className="text-sm text-gray-600">
                    You are about to submit <strong>{piProjectTitle || 'your pitch'}</strong> as {piFullName} ({piEmail}).
                  </p>
                  {ndaBlock}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNdaAccepted(false)
                        setNdaSignature('')
                        setStep('form')
                      }}
                      className="flex-1 py-3 rounded-xl font-medium border border-gray-300 text-gray-800 hover:bg-gray-50"
                    >
                      Back to form
                    </button>
                    <button
                      type="submit"
                      disabled={piLoading}
                      className="flex-1 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60"
                    >
                      {piLoading ? 'Sending…' : 'Submit request'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
