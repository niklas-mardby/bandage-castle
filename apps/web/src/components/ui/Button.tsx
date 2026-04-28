import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'link'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: ReactNode
  loading?: boolean
}

export function Button({ variant = 'secondary', icon, loading, children, className, disabled, ...rest }: Props) {
  return (
    <button {...rest} disabled={disabled || loading} className={`btn btn-${variant} ${className ?? ''}`}>
      {loading ? <span className="btn-spinner" aria-hidden /> : icon}
      {children}
    </button>
  )
}
