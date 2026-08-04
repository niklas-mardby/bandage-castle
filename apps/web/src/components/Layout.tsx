import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { hasRole, isStaff } from '@bandage/shared'
import { useAuth } from '../auth/AuthProvider'
import { NAV } from '../nav/navConfig'
import NotificationBell from './NotificationBell'
import SearchBox from './SearchBox'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const doLogout = async () => {
    await logout()
    navigate('/login')
  }

  const items = NAV.filter((item) => !item.roles || hasRole(user, ...item.roles))
  const groups = ['main', 'care', 'business', 'me', 'admin'] as const

  return (
    <div>
      <nav className="nav">
        {user && (
          <span className="nav-user">
            {isStaff(user) && <SearchBox />}
            <NotificationBell /> <Link to="/account">{user.name || user.email}</Link> <button onClick={doLogout}>log out</button>
          </span>
        )}
        {groups.map((g) => {
          const links = items.filter((i) => i.group === g)
          if (links.length === 0) return null
          return (
            <span className={`nav-group nav-${g}`} key={g}>
              {links.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.to === '/'} title={i.label}>
                  {i.icon} {i.label}
                </NavLink>
              ))}
            </span>
          )
        })}
      </nav>
      <Outlet />
    </div>
  )
}
