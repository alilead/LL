import { useMemo, useState } from 'react'
import { ALL_LOCATION_OPTIONS } from './dataRequestCountries'
import { inputClass, labelClass } from './intakeFieldClasses'

interface CountryMultiSelectProps {
  value: string[]
  onChange: (next: string[]) => void
  otherValue: string
  onOtherChange: (v: string) => void
}

export function CountryMultiSelect({ value, onChange, otherValue, onOtherChange }: CountryMultiSelectProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_LOCATION_OPTIONS
    return ALL_LOCATION_OPTIONS.filter((c) => c.toLowerCase().includes(q))
  }, [query])

  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt))
    } else {
      onChange([...value, opt])
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Countries *</label>
        <p className="text-sm text-gray-500 mb-2">
          Select regions or countries where you want leads. Tip: use Ctrl+F (Cmd+F on Mac) in the list below to search.
        </p>
        <input
          className={inputClass}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter countries and regions…"
          aria-label="Filter countries"
        />
      </div>
      {value.length > 0 && (
        <p className="text-xs text-indigo-700 font-medium">{value.length} selected</p>
      )}
      <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto p-3 space-y-1.5 bg-gray-50/50">
        {filtered.map((opt) => (
          <label key={opt} className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-gray-300"
              checked={value.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span className="leading-snug">{opt}</span>
          </label>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 px-1">No matches.</p>}
      </div>
      <div>
        <label className={labelClass}>Other country / region</label>
        <input
          className={inputClass}
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="If not listed above"
        />
      </div>
    </div>
  )
}
