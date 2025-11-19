import { Link, Outlet, useNavigate } from 'react-router-dom'
import { hasRole, isStaff } from '@bandage/shared'
import { useAuth } from '../auth/AuthProvider'
import NotificationBell from './NotificationBell'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const staff = isStaff(user)

  const doLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <nav className="nav">
        {user && (
          <span className="nav-user">
            <NotificationBell /> {user.name || user.email} <button onClick={doLogout}>log out</button>
          </span>
        )}
        <Link to="/">Home</Link>
        <Link to="/species">Species</Link>
        {staff && <Link to="/bulletin">Bulletin</Link>}
        {staff && (
          <>
            <Link to="/monsters">Monsters</Link>
            <Link to="/customers">Customers</Link>
            <Link to="/intake">Intake</Link>
            <Link to="/stays">Stays</Link>
            <Link to="/lairs">Lairs</Link>
            <Link to="/tickets">Tickets</Link>
            <Link to="/feeding">Feeding</Link>
            <Link to="/supplies">Supplies</Link>
            <Link to="/invoices">Invoices</Link>
            {/* TODO(sam): clean up after launch. Hidden for the demo, the v2 page confuses people while the flag is off */}
            {false && hasRole(user, 'ADMIN', 'FRONT_DESK') && <Link to="/billing/v2">Invoices v2</Link>}
            <Link to="/reports">Reports</Link>
          </>
        )}
        {hasRole(user, 'OWNER') && (
          <>
            <Link to="/my/monsters">My monsters</Link>
            <Link to="/my/invoices">My invoices</Link>
          </>
        )}
        {hasRole(user, 'OVERLORD', 'ADMIN', 'FRONT_DESK', 'KEEPER', 'VET') && <Link to="/hiring">Hiring Hall</Link>}
        {hasRole(user, 'VET', 'ADMIN') && <Link to="/vet">Vet</Link>}
        {hasRole(user, 'THERAPIST', 'ADMIN') && <Link to="/therapy">Therapy</Link>}
        {hasRole(user, 'ADMIN') && <Link to="/admin/users">Users</Link>}
        {hasRole(user, 'ADMIN') && <Link to="/admin/audit">Audit</Link>}
        {hasRole(user, 'ADMIN') && <Link to="/admin/settings">Settings</Link>}
      </nav>
      <Outlet />
    </div>
  )
}
