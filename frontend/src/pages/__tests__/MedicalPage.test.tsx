import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../context/AuthContext'
import { MedicalPage } from '../MedicalPage'

vi.mock('../../hooks/useMedical', () => ({
  useMedical: () => ({
    analytics: {
      open_incidents: 3,
      critical_incidents: 1,
      low_stock_count: 2,
      expiring_soon_count: 4,
    },
    incidents: [
      {
        id: 'inc-001',
        employee_name: 'Thabo Nkosi',
        department: 'Operations',
        incident_type: 'Sprain',
        severity: 'Minor',
        status: 'Open',
        reported_at: '2025-06-01T09:15:00Z',
      },
      {
        id: 'inc-002',
        employee_name: 'Naledi Dube',
        department: 'Facilities',
        incident_type: 'Cut',
        severity: 'Critical',
        status: 'Referred',
        reported_at: '2025-06-02T14:00:00Z',
      },
    ],
    items: [
      {
        id: 'mitem-1',
        name: 'Adhesive Bandages',
        quantity: 50,
        unit: 'Box',
        min_level: 10,
        expiry_date: '2027-06-30',
      },
      {
        id: 'mitem-2',
        name: 'Latex Gloves (S)',
        quantity: 3,
        unit: 'Box',
        min_level: 5,
        expiry_date: null,
      },
    ],
    isLoading: false,
    addItem: { mutate: vi.fn(), isPending: false },
    updateItem: { mutate: vi.fn(), isPending: false },
    deleteItem: { mutate: vi.fn(), isPending: false },
    logIncident: { mutate: vi.fn(), isPending: false },
    updateIncidentStatus: { mutate: vi.fn(), isPending: false },
  }),
}))

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderPage() {
  localStorage.setItem('sm_access_token', 'mock-token')
  localStorage.setItem(
    'sm_user',
    JSON.stringify({ id: 'user-1', email: 'test@spacemind.co', full_name: 'Test User', role: 'facilities_manager', is_active: true }),
  )
  return render(
    <MemoryRouter>
      <AuthProvider>
        <QueryClientProvider client={makeQc()}>
          <MedicalPage />
        </QueryClientProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('MedicalPage', () => {
  it('renders all four stat strip labels', () => {
    renderPage()
    expect(screen.getByText('Open Incidents')).toBeInTheDocument()
    expect(screen.getByText('Critical Cases')).toBeInTheDocument()
    expect(screen.getByText('Low Medical Stock')).toBeInTheDocument()
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument()
  })

  it('renders incident rows with correct patient names', () => {
    renderPage()
    expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument()
    expect(screen.getByText('Naledi Dube')).toBeInTheDocument()
  })

  it('renders severity badges for incidents', () => {
    renderPage()
    expect(screen.getByText('Minor')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('renders incident status badges', () => {
    renderPage()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Referred')).toBeInTheDocument()
  })

  it('renders Quick Actions section with New Incident button', () => {
    renderPage()
    expect(screen.getByText('New Incident')).toBeInTheDocument()
    expect(screen.getByText('Vital Signs')).toBeInTheDocument()
  })

  it('renders first aid kit items in the inventory table', () => {
    renderPage()
    expect(screen.getByText('Adhesive Bandages')).toBeInTheDocument()
    expect(screen.getByText('Latex Gloves (S)')).toBeInTheDocument()
  })

  it('shows Low stock status badge for item below minimum', () => {
    renderPage()
    // Latex Gloves (S): quantity=3, min_level=5 → Low
    expect(screen.getAllByText('Low').length).toBeGreaterThan(0)
  })
})
