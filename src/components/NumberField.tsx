interface NumberFieldProps {
  label: string
  value: number | undefined
  suffix?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
  onChange: (value: number | undefined) => void
  onBlur?: () => void
  required?: boolean
}

export const NumberField = ({
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  placeholder,
  onChange,
  onBlur,
  required,
}: NumberFieldProps) => (
  <label className="field">
    <span className="field__label">{label}</span>
    <span className="number-input">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        onBlur={onBlur}
      />
      {suffix && <span>{suffix}</span>}
    </span>
  </label>
)

