import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FieldProps = { label: ReactNode; error?: string | null; hint?: ReactNode; children: ReactNode }

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div className={`ui-field ${error ? 'has-error' : ''}`}>
      <label>{label}</label>
      {children}
      {hint && !error && <div className="ui-hint">{hint}</div>}
      {error && <div className="ui-field-error">{error}</div>}
    </div>
  )
}

export function TextInput({ label, error, hint, ...rest }: Omit<FieldProps, 'children'> & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input {...rest} />
    </Field>
  )
}

export function TextArea({ label, error, hint, ...rest }: Omit<FieldProps, 'children'> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea {...rest} />
    </Field>
  )
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  ...rest
}: Omit<FieldProps, 'children'> & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[]; placeholder?: string }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <select {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
