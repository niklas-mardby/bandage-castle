import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hasRole } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { Button, Card, ErrorMessage, Select, TextInput } from '../../components/ui'

function ProfileCard() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const save = useMutation({ mutationFn: () => apiFetch('/auth/me', { method: 'PATCH', body: { name } }) })
  return (
    <Card title="👤 Profile">
      <p className="muted">
        {user?.email} · {user?.roles.join(', ')}
      </p>
      <TextInput label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
      <Button variant="primary" loading={save.isPending} disabled={!name.trim()} onClick={() => save.mutate()}>
        Save
      </Button>
      {save.isSuccess && <span className="muted"> saved ✓ (shows after your next login)</span>}
      <ErrorMessage error={save.error} />
    </Card>
  )
}

function PasswordCard() {
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew] = useState('')
  const [repeat, setRepeat] = useState('')
  const change = useMutation({
    mutationFn: () => apiFetch('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
    onSuccess: () => {
      setCurrent('')
      setNew('')
      setRepeat('')
    },
  })
  const mismatch = repeat.length > 0 && repeat !== newPassword
  return (
    <Card title="🔑 Change password">
      <TextInput label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
      <TextInput label="New password" type="password" autoComplete="new-password" hint="At least 8 characters" value={newPassword} onChange={(e) => setNew(e.target.value)} />
      <TextInput label="Repeat new password" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} error={mismatch ? 'Passwords do not match' : null} />
      <Button variant="primary" loading={change.isPending} disabled={!currentPassword || newPassword.length < 8 || mismatch} onClick={() => change.mutate()}>
        Change password
      </Button>
      {change.isSuccess && <p className="success">🔐 Password changed.</p>}
      <ErrorMessage error={change.error} />
    </Card>
  )
}

type MyCustomer = { id: number; name: string; contactPref: 'raven' | 'crystal ball' | 'email'; lairAddress: string | null }

function ContactCard() {
  const qc = useQueryClient()
  const { data: me } = useQuery({ queryKey: ['customer-me'], queryFn: () => apiFetch('/customers/me') as Promise<MyCustomer> })
  const save = useMutation({
    mutationFn: (contactPref: string) => apiFetch('/customers/me', { method: 'PATCH', body: { contactPref } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-me'] }),
  })
  if (!me) return null
  return (
    <Card title="🐦 How should we contact you?">
      <Select
        label="Preferred channel"
        value={me.contactPref}
        onChange={(e) => save.mutate(e.target.value)}
        options={[
          { value: 'raven', label: '🐦 Raven' },
          { value: 'crystal ball', label: '🔮 Crystal ball' },
          { value: 'email', label: '📧 Email' },
        ]}
      />
      <p className="muted">Lair address on file: {me.lairAddress ?? '—'}. Ask the front desk to change it.</p>
    </Card>
  )
}

export default function AccountPage() {
  const { user } = useAuth()
  return (
    <div className="page account">
      <h2>⚙️ My account</h2>
      <ProfileCard />
      <PasswordCard />
      {hasRole(user, 'OWNER', 'OVERLORD') && <ContactCard />}
    </div>
  )
}
