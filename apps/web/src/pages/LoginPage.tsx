import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      const from = (location.state as { from?: string } | null)?.from
      // everyone lands on their dashboard now
      navigate(from || '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="login">
      <h1>🩹 Bandage Castle</h1>
      <form onSubmit={submit}>
        <input placeholder="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Log in</button>
        {error && <p className="error">{error}</p>}
      </form>
      <Link to="/forgot-password">forgot password?</Link>
    </div>
  )
}
