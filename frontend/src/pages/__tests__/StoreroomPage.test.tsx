import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../context/AuthContext'
import { StoreroomPage } from '../StoreroomPage'

const { mockAddMutate } = vi.hoisted(() => ({
  mockAddMutate: vi.fn(),
}))

vi.mock('../../hooks/useStoreroom', async () => {
  const real = await vi.importActual<typeof import('../../hooks/useStoreroom')>('../../hooks/useStoreroom')
  return {
    ...real,
    useStoreroom: () => ({
      items: [
        {
          id: 'item-1',
          name: 'Cable Ties 100mm',
          code: 'EL-007',
          category: 'Electrical',
          quantity: 20,
          unit: 'Pcs',
          min_level: 5,
          location: 'A-01',
          notes: null,
        },
        {
          id: 'item-2',
          name: 'Latex Gloves',
          code: 'HY-001',
          category: 'Hygiene',
          quantity: 2,
          unit: 'Box',
          min_level: 5,
          location: 'B-02',
          notes: null,
        },
      ],
      transactions: [],
      requisitions: [],
      isLoading: false,
      addItem: { mutate: mockAddMutate, isPending: false },
      updateItem: { mutate: vi.fn(), isPending: false },
      deleteItem: { mutate: vi.fn(), isPending: false },
      signOut: { mutate: vi.fn(), isPending: false },
      returnItem: { mutate: vi.fn(), isPending: false },
      addRequisition: { mutate: vi.fn(), isPending: false },
      updateReqStatus: { mutate: vi.fn(), isPending: false },
      itemStockStatus: real.itemStockStatus,
    }),
  }
})

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
          <StoreroomPage />
        </QueryClientProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('StoreroomPage', () => {
  it('renders inventory table with mocked items', () => {
    renderPage()
    expect(screen.getByText('Cable Ties 100mm')).toBeInTheDocument()
    expect(screen.getByText('Latex Gloves')).toBeInTheDocument()
    expect(screen.getByText('EL-007')).toBeInTheDocument()
  })

  it('shows Total SKUs label in stats strip', () => {
    renderPage()
    expect(screen.getByText('Total SKUs')).toBeInTheDocument()
  })

  it('shows Low stock badge for item below minimum level', () => {
    renderPage()
    // Latex Gloves: quantity=2, min_level=5 → Low
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('opens Add Item modal when Add Item button is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /^add item$/i }))
    expect(screen.getByText('Add Inventory Item')).toBeInTheDocument()
  })

  it('shows validation error when modal is submitted without required fields', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /^add item$/i }))
    // Two "Add Item" buttons: toolbar + modal submit — click the modal one (last)
    const addBtns = screen.getAllByRole('button', { name: /add item/i })
    await user.click(addBtns[addBtns.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/name, code, and location are required/i)).toBeInTheDocument()
    })
  })

  it('calls addItem.mutate when form is filled and submitted', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /^add item$/i }))

    await user.type(screen.getByPlaceholderText('e.g. Cable Ties 100mm'), 'Test Item')
    await user.type(screen.getByPlaceholderText('e.g. EL-007'), 'TS-001')
    await user.type(screen.getByPlaceholderText('e.g. A-01, B-03, F-07'), 'C-01')

    const addBtns = screen.getAllByRole('button', { name: /add item/i })
    await user.click(addBtns[addBtns.length - 1])

    await waitFor(() => {
      expect(mockAddMutate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Item', code: 'TS-001', location: 'C-01' }),
      )
    })
  })
})
