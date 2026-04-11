import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { LandingPage } from './pages/LandingPage'
import { MethodologyPage } from './pages/MethodologyPage'
import { PillarSystematicPage } from './pages/methodology/PillarSystematic'
import { PillarStakeholderPage } from './pages/methodology/PillarStakeholder'
import { PillarDataPage } from './pages/methodology/PillarData'
import { PillarInnovationPage } from './pages/methodology/PillarInnovation'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DecomposePage } from './pages/DecomposePage'
import { HistoryPage } from './pages/HistoryPage'
import { LocationsPage } from './pages/LocationsPage'
import { StoreroomPage } from './pages/StoreroomPage'
import { FloorPlansPage } from './pages/FloorPlansPage'
import { MedicalPage } from './pages/MedicalPage'
import { ConciergePage } from './pages/ConciergePage'
import { KPIPage } from './pages/KPIPage'
import { NewsTrainingPage } from './pages/NewsTrainingPage'
import { SmartInsightsPage } from './pages/SmartInsightsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/decompose" element={<DecomposePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:id" element={<HistoryPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/storeroom" element={<StoreroomPage />} />
              <Route path="/inventory" element={<StoreroomPage />} />
              <Route path="/signout" element={<StoreroomPage />} />
              <Route path="/floor-plans" element={<FloorPlansPage />} />
              <Route path="/medical" element={<MedicalPage />} />
              <Route path="/concierge" element={<ConciergePage />} />
              <Route path="/kpi" element={<KPIPage />} />
              <Route path="/news-training" element={<NewsTrainingPage />} />
              <Route path="/smart-insights" element={<SmartInsightsPage />} />
            </Route>
          </Routes>
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
  )
}
