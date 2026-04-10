import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { DecomposePage } from './pages/DecomposePage'
import { HistoryPage } from './pages/HistoryPage'
import { LocationsPage } from './pages/LocationsPage'

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
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/decompose" element={<DecomposePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:id" element={<HistoryPage />} />
            <Route path="/locations" element={<LocationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
