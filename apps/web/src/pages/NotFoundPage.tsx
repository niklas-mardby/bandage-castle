import { Link, useLocation } from 'react-router-dom'

export default function NotFoundPage() {
  const location = useLocation()
  return (
    <div className="page not-found">
      <h1>404 🦇</h1>
      <p>
        We searched every lair, but <code>{location.pathname}</code> isn't here.
      </p>
      <p className="muted">Maybe the slime ate it.</p>
      <Link to="/">← Back to the castle</Link>
    </div>
  )
}
