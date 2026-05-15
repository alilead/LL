import { inputClass, labelClass } from './intakeFieldClasses'

interface CheckboxGroupProps {
  label: string
  description?: string
  options: readonly string[]
  value: string[]
  onChange: (next: string[]) => void
  required?: boolean
  allowOther?: boolean
  otherValue?: string
  onOtherChange?: (v: string) => void
}

export function CheckboxGroup({
  label,
  description,
  options,
  value,
  onChange,
  required,
  allowOther,
  otherValue = '',
  onOtherChange,
}: CheckboxGroupProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt))
    } else {
      onChange([...value, opt])
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className={labelClass}>
        {label}
        {required ? ' *' : ''}
      </legend>
      {description && <p className="text-sm text-gray-500 -mt-1">{description}</p>}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {options.map((opt) => (
          <label key={opt} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 rounded border-gray-300"
              checked={value.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {allowOther && (
        <div className="pt-2">
          <label className={labelClass}>Other</label>
          <input
            className={inputClass}
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder="Specify if not listed"
          />
        </div>
      )}
    </fieldset>
  )
}
