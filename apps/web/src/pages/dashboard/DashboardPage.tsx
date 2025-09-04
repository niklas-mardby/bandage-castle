import { hasRole } from '@bandage/shared'
import { useAuth } from '../../auth/AuthProvider'
import { AdminSection, CustomerSection, FrontDeskSection, KeeperSection, ScribeSection, TherapistSection, VetSection } from './sections'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="page dashboard">
      <h2>
        {greeting()}, {user.name || user.email} 🏰
      </h2>
      {hasRole(user, 'ADMIN') && <AdminSection />}
      {hasRole(user, 'FRONT_DESK') && <FrontDeskSection />}
      {hasRole(user, 'KEEPER') && <KeeperSection />}
      {hasRole(user, 'VET') && <VetSection />}
      {hasRole(user, 'THERAPIST') && <TherapistSection />}
      {hasRole(user, 'SCRIBE') && <ScribeSection />}
      {hasRole(user, 'OWNER', 'OVERLORD') && <CustomerSection overlord={hasRole(user, 'OVERLORD')} />}
    </div>
  )
}
