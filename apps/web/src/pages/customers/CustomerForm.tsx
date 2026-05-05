import { useState } from 'react'
import { Button, ErrorMessage, Select, TextArea, TextInput } from '../../components/ui'
import type { ContactPref } from './types'

export type CustomerFormValue = {
  title: string
  firstName: string
  lastName: string
  email: string
  contactPref: ContactPref
  lairAddress: string
  notes: string
}

export const EMPTY_CUSTOMER: CustomerFormValue = { title: '', firstName: '', lastName: '', email: '', contactPref: 'raven', lairAddress: '', notes: '' }

/** Turns the form into what the API expects: empty strings become null. */
export function toPayload(v: CustomerFormValue) {
  const orNull = (s: string) => (s.trim() ? s.trim() : null)
  return {
    title: orNull(v.title),
    firstName: orNull(v.firstName),
    lastName: v.lastName.trim(),
    email: orNull(v.email),
    contactPref: v.contactPref,
    lairAddress: orNull(v.lairAddress),
    notes: orNull(v.notes),
  }
}

export default function CustomerForm({
  initial,
  submitLabel,
  saving,
  error,
  onSubmit,
}: {
  initial: CustomerFormValue
  submitLabel: string
  saving: boolean
  error: unknown
  onSubmit: (value: CustomerFormValue) => void
}) {
  const [v, setV] = useState(initial)
  const set = (field: keyof CustomerFormValue) => (e: { target: { value: string } }) => setV({ ...v, [field]: e.target.value })
  const emailError = v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) ? 'That does not look like an email address' : null

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(v)
      }}
    >
      <TextInput label="Title" hint="Lord, Lady, Dread Sorceress..." value={v.title} onChange={set('title')} />
      <TextInput label="First name" value={v.firstName} onChange={set('firstName')} />
      <TextInput label="Last name *" value={v.lastName} onChange={set('lastName')} />
      <TextInput label="Email" value={v.email} onChange={set('email')} error={emailError} />
      <Select
        label="Contact by"
        value={v.contactPref}
        onChange={set('contactPref')}
        options={[
          { value: 'raven', label: '🐦 Raven' },
          { value: 'crystal ball', label: '🔮 Crystal ball' },
          { value: 'email', label: '📧 Email' },
        ]}
      />
      <TextArea label="Lair address" value={v.lairAddress} onChange={set('lairAddress')} />
      <TextArea label="Notes" value={v.notes} onChange={set('notes')} />
      <ErrorMessage error={error} />
      <Button type="submit" variant="primary" loading={saving} disabled={!v.lastName.trim() || !!emailError}>
        {submitLabel}
      </Button>
    </form>
  )
}
