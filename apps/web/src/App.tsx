import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAuth } from './auth/RequireAuth'
import { useAuth } from './auth/AuthProvider'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import MonsterListPage from './pages/MonsterListPage'
import MonsterDetailPage from './pages/MonsterDetailPage'
import MonsterFormPage from './pages/MonsterFormPage'
import CustomerListPage from './pages/CustomerListPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import NewCustomerPage from './pages/NewCustomerPage'
import StayListPage from './pages/StayListPage'
import StayDetailPage from './pages/stays/StayDetailPage'
import NewStayPage from './pages/NewStayPage'
import InvoiceListPage from './pages/InvoiceListPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import InvoicesV2Page from './pages/billing/InvoicesV2Page'
import ReportsPage from './pages/ReportsPage'
import MyMonstersPage from './pages/MyMonstersPage'
import MyInvoicesPage from './pages/MyInvoicesPage'
import UsersPage from './pages/admin/UsersPage'
import SpeciesListPage from './pages/species/SpeciesListPage'
import SpeciesDetailPage from './pages/species/SpeciesDetailPage'
import LairListPage from './pages/lairs/LairListPage'
import LairDetailPage from './pages/lairs/LairDetailPage'
import IntakePage from './pages/intake/IntakePage'
import VetDashboardPage from './pages/medical/VetDashboardPage'
import MonsterMedicalPage from './pages/medical/MonsterMedicalPage'
import TicketListPage from './pages/tickets/TicketListPage'
import TicketDetailPage from './pages/tickets/TicketDetailPage'
import NewTicketPage from './pages/tickets/NewTicketPage'
import SuppliesPage from './pages/supplies/SuppliesPage'
import FeedingPage from './pages/feeding/FeedingPage'
import HiringHallPage from './pages/hiring/HiringHallPage'
import ListingDetailPage from './pages/hiring/ListingDetailPage'
import ManageListingsPage from './pages/hiring/ManageListingsPage'
import ApplicationsPage from './pages/hiring/ApplicationsPage'
import ContractsPage from './pages/hiring/ContractsPage'

function Home() {
  const { user } = useAuth()
  return <div className="page">Welcome to the castle, {user?.name || user?.email} 🏰</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/monsters" element={<MonsterListPage />} />
        <Route path="/monsters/new" element={<MonsterFormPage />} />
        <Route path="/monsters/:id" element={<MonsterDetailPage />} />
        <Route path="/monsters/:id/edit" element={<MonsterFormPage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/new" element={<NewCustomerPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/stays" element={<StayListPage />} />
        <Route path="/stays/new" element={<NewStayPage />} />
        <Route path="/stays/:id" element={<StayDetailPage />} />
        <Route path="/invoices" element={<InvoiceListPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/billing/v2" element={<InvoicesV2Page />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/species" element={<SpeciesListPage />} />
        <Route path="/species/:slug" element={<SpeciesDetailPage />} />
        <Route path="/lairs" element={<LairListPage />} />
        <Route path="/lairs/:id" element={<LairDetailPage />} />
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/vet" element={<VetDashboardPage />} />
        <Route path="/monsters/:id/medical" element={<MonsterMedicalPage />} />
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/new" element={<NewTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/supplies" element={<SuppliesPage />} />
        <Route path="/feeding" element={<FeedingPage />} />
        <Route path="/hiring" element={<HiringHallPage />} />
        <Route path="/hiring/manage" element={<ManageListingsPage />} />
        <Route path="/hiring/applications" element={<ApplicationsPage />} />
        <Route path="/hiring/contracts" element={<ContractsPage />} />
        <Route path="/hiring/:id" element={<ListingDetailPage />} />
        <Route path="/my/monsters" element={<MyMonstersPage />} />
        <Route path="/my/invoices" element={<MyInvoicesPage />} />
        <Route
          path="/admin/users"
          element={
            <RequireAuth roles={['ADMIN']}>
              <UsersPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  )
}
