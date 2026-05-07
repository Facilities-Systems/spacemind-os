import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Spinner } from './components/ui/Spinner'

// ── Code-split pages — each route gets its own JS chunk ───────────────────────
// Named-export pages use .then(m => ({ default: m.Name })) for React.lazy compat

const LandingPage           = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const MethodologyPage       = lazy(() => import('./pages/MethodologyPage').then(m => ({ default: m.MethodologyPage })))
const PillarSystematicPage  = lazy(() => import('./pages/methodology/PillarSystematic').then(m => ({ default: m.PillarSystematicPage })))
const PillarStakeholderPage = lazy(() => import('./pages/methodology/PillarStakeholder').then(m => ({ default: m.PillarStakeholderPage })))
const PillarDataPage        = lazy(() => import('./pages/methodology/PillarData').then(m => ({ default: m.PillarDataPage })))
const PillarInnovationPage  = lazy(() => import('./pages/methodology/PillarInnovation').then(m => ({ default: m.PillarInnovationPage })))
const LoginPage             = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage         = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const DecomposePage         = lazy(() => import('./pages/DecomposePage').then(m => ({ default: m.DecomposePage })))
const HistoryPage           = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const LocationsPage         = lazy(() => import('./pages/LocationsPage').then(m => ({ default: m.LocationsPage })))
const StoreroomPage         = lazy(() => import('./pages/StoreroomPage').then(m => ({ default: m.StoreroomPage })))
const FloorPlansPage        = lazy(() => import('./pages/FloorPlansPage').then(m => ({ default: m.FloorPlansPage })))
const MedicalPage           = lazy(() => import('./pages/MedicalPage').then(m => ({ default: m.MedicalPage })))
const ConciergePage         = lazy(() => import('./pages/ConciergePage').then(m => ({ default: m.ConciergePage })))
const KPIPage               = lazy(() => import('./pages/KPIPage').then(m => ({ default: m.KPIPage })))
const NewsTrainingPage      = lazy(() => import('./pages/NewsTrainingPage').then(m => ({ default: m.NewsTrainingPage })))
const SmartInsightsPage     = lazy(() => import('./pages/SmartInsightsPage').then(m => ({ default: m.SmartInsightsPage })))
const AdminPage             = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const AssetsPage            = lazy(() => import('./pages/AssetsPage').then(m => ({ default: m.AssetsPage })))
const TicketsPage           = lazy(() => import('./pages/TicketsPage').then(m => ({ default: m.TicketsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
})

const PageFallback = () => (
  <div className="flex items-center justify-center h-screen bg-[#1e293b]" role="status" aria-label="Loading page">
    <Spinner size="lg" />
  </div>
)

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="/methodology/systematic-processes"    element={<PillarSystematicPage />} />
              <Route path="/methodology/stakeholder-integration" element={<PillarStakeholderPage />} />
              <Route path="/methodology/data-intelligence"       element={<PillarDataPage />} />
              <Route path="/methodology/continuous-innovation"   element={<PillarInnovationPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected — all nested under Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard"     element={<DashboardPage />} />
                <Route path="/decompose"     element={<DecomposePage />} />
                <Route path="/history"       element={<HistoryPage />} />
                <Route path="/history/:id"   element={<HistoryPage />} />
                <Route path="/locations"     element={<LocationsPage />} />
                <Route path="/storeroom"     element={<StoreroomPage />} />
                <Route path="/inventory"     element={<StoreroomPage />} />
                <Route path="/signout"       element={<StoreroomPage />} />
                <Route path="/floor-plans"   element={<FloorPlansPage />} />
                <Route path="/medical"       element={<MedicalPage />} />
                <Route path="/concierge"     element={<ConciergePage />} />
                <Route path="/kpi"           element={<KPIPage />} />
                <Route path="/news-training" element={<NewsTrainingPage />} />
                <Route path="/smart-insights" element={<SmartInsightsPage />} />
                <Route path="/admin"         element={<AdminPage />} />
                <Route path="/assets"        element={<AssetsPage />} />
                <Route path="/tickets"       element={<TicketsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#171a23',
              color: '#fff',
              border: '1px solid #1f2535',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#052e16' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#3d0000' } },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
