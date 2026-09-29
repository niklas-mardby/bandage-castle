import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAuth } from './auth/RequireAuth'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import MonsterListPage from './pages/MonsterListPage'
import MonsterDetailPage from './pages/MonsterDetailPage'
import MonsterFormPage from './pages/MonsterFormPage'
import MonsterProfilePage from './pages/monsters/MonsterProfilePage'
import CustomerListPage from './pages/customers/CustomerListPage'
import CustomerDetailPage from './pages/customers/CustomerDetailPage'
import NewCustomerPage from './pages/customers/NewCustomerPage'
import StayListPage from './pages/StayListPage'
import StayDetailPage from './pages/stays/StayDetailPage'
import StayCalendarPage from './pages/stays/StayCalendarPage'
import NewStayPage from './pages/NewStayPage'
import InvoiceListPage from './pages/InvoiceListPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import InvoicesV2Page from './pages/billing/InvoicesV2Page'
import InvoiceV2DetailPage from './pages/billing/InvoiceV2DetailPage'
import TherapyPlansPage from './pages/therapy/TherapyPlansPage'
import TherapyPlanPage from './pages/therapy/TherapyPlanPage'
import BulletinIndexPage from './pages/bulletin/BulletinIndexPage'
import BulletinPageView from './pages/bulletin/BulletinPageView'
import BulletinPostView from './pages/bulletin/BulletinPostView'
import BulletinEditorPage from './pages/bulletin/BulletinEditorPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import AccountPage from './pages/account/AccountPage'
import BookStayPage from './pages/bookings/BookStayPage'
import BookingRequestsPage from './pages/bookings/BookingRequestsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ClassicReportsPage from './pages/ReportsPage'
import ReportsPage from './pages/reports/ReportsPage'
import MyMonstersPage from './pages/MyMonstersPage'
import MyInvoicesPage from './pages/MyInvoicesPage'
import UsersPage from './pages/admin/UsersPage'
import AuditLogPage from './pages/admin/AuditLogPage'
import SettingsPage from './pages/admin/SettingsPage'
import JobsPage from './pages/admin/JobsPage'
import SpeciesListPage from './pages/species/SpeciesListPage'
import SpeciesDetailPage from './pages/species/SpeciesDetailPage'
import SpeciesFormPage from './pages/species/SpeciesFormPage'
import LairListPage from './pages/lairs/LairListPage'
import LairDetailPage from './pages/lairs/LairDetailPage'
import LairFormPage from './pages/lairs/LairFormPage'
import IntakePage from './pages/intake/IntakePage'
import VetDashboardPage from './pages/medical/VetDashboardPage'
import MonsterMedicalPage from './pages/medical/MonsterMedicalPage'
import RoundsPage from './pages/medical/RoundsPage'
import TicketListPage from './pages/tickets/TicketListPage'
import TicketDetailPage from './pages/tickets/TicketDetailPage'
import TicketBoardPage from './pages/tickets/TicketBoardPage'
import NewTicketPage from './pages/tickets/NewTicketPage'
import SuppliesPage from './pages/supplies/SuppliesPage'
import ReorderPage from './pages/supplies/ReorderPage'
import FeedingPage from './pages/feeding/FeedingPage'
import HiringHallPage from './pages/hiring/HiringHallPage'
import ListingDetailPage from './pages/hiring/ListingDetailPage'
import ManageListingsPage from './pages/hiring/ManageListingsPage'
import ApplicationsPage from './pages/hiring/ApplicationsPage'
import ContractsPage from './pages/hiring/ContractsPage'
import ContractPrintPage from './pages/hiring/ContractPrintPage'

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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/monsters" element={<MonsterListPage />} />
        <Route path="/monsters/new" element={<MonsterFormPage />} />
        <Route path="/monsters/:id" element={<MonsterDetailPage />} />
        <Route path="/monsters/:id/edit" element={<MonsterFormPage />} />
        <Route path="/monsters/:id/profile" element={<MonsterProfilePage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/new" element={<NewCustomerPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/stays" element={<StayListPage />} />
        <Route path="/stays/new" element={<NewStayPage />} />
        <Route path="/stays/calendar" element={<StayCalendarPage />} />
        <Route path="/stays/:id" element={<StayDetailPage />} />
        <Route path="/invoices" element={<InvoiceListPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/billing/v2" element={<InvoicesV2Page />} />
        <Route path="/billing/v2/:id" element={<InvoiceV2DetailPage />} />
        <Route path="/therapy" element={<TherapyPlansPage />} />
        <Route path="/therapy/:id" element={<TherapyPlanPage />} />
        <Route path="/bulletin" element={<BulletinIndexPage />} />
        <Route path="/bulletin/pages/:slug" element={<BulletinPageView />} />
        <Route path="/bulletin/posts/:slug" element={<BulletinPostView />} />
        <Route path="/bulletin/new" element={<BulletinEditorPage />} />
        <Route path="/bulletin/edit/:id" element={<BulletinEditorPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/classic" element={<ClassicReportsPage />} />
        <Route path="/species" element={<SpeciesListPage />} />
        <Route path="/species/new" element={<SpeciesFormPage />} />
        <Route path="/species/:slug" element={<SpeciesDetailPage />} />
        <Route path="/species/:slug/edit" element={<SpeciesFormPage />} />
        <Route path="/lairs" element={<LairListPage />} />
        <Route path="/lairs/new" element={<LairFormPage />} />
        <Route path="/lairs/:id" element={<LairDetailPage />} />
        <Route path="/lairs/:id/edit" element={<LairFormPage />} />
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/vet" element={<VetDashboardPage />} />
        <Route path="/rounds" element={<RoundsPage />} />
        <Route path="/monsters/:id/medical" element={<MonsterMedicalPage />} />
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/new" element={<NewTicketPage />} />
        <Route path="/tickets/board" element={<TicketBoardPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/supplies" element={<SuppliesPage />} />
        <Route path="/supplies/reorder" element={<ReorderPage />} />
        <Route path="/feeding" element={<FeedingPage />} />
        <Route path="/hiring" element={<HiringHallPage />} />
        <Route path="/hiring/manage" element={<ManageListingsPage />} />
        <Route path="/hiring/applications" element={<ApplicationsPage />} />
        <Route path="/hiring/contracts" element={<ContractsPage />} />
        <Route path="/hiring/contracts/:id/print" element={<ContractPrintPage />} />
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
        <Route
          path="/admin/audit"
          element={
            <RequireAuth roles={['ADMIN']}>
              <AuditLogPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAuth roles={['ADMIN']}>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <RequireAuth roles={['ADMIN']}>
              <JobsPage />
            </RequireAuth>
          }
        />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/book" element={<BookStayPage />} />
        <Route path="/bookings" element={<BookingRequestsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
