import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../../context/AuthContext'
import { DecomposePage } from '../DecomposePage'

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn().mockImplementation((_args, callbacks) => {
    callbacks?.onSuccess({
      id: 'decomp-test-123',
      created_at: '2025-01-01T00:00:00Z',
      request_summary: 'Move 40 staff from FP1 to FP2',
      original_request: 'Move 40 staff from FP1 to FP2 within the next 6 weeks',
      request_type: 'office_move',
      priority: 'normal',
      location_context: {
        location_id: 'FP1_HQ_SouthAfrica',
        tenure: 'owned',
        country: 'South Africa',
        landlord_approval_required: false,
      },
      phases: [
        { id: 'p1', name: 'Planning', order: 1, tasks: [], status: 'pending' },
      ],
      total_tasks: 8,
      key_risks: ['Timeline risk'],
      recommendations: [],
      landlord_items: [],
      compliance_notes: [],
      metadata: {},
    })
  }),
}))

vi.mock('../../hooks/useDecompose', () => ({
  useDecompose: () => ({ mutate: mockMutate, isPending: false }),
  useLocations: () => ({
    data: [
      { id: 'FP1_HQ_SouthAfrica', country: 'South Africa', tenure: 'owned', landlord_required: false, notes: '' },
      { id: 'FP2_Cape_Town', country: 'South Africa', tenure: 'rented', landlord_required: true, notes: '' },
    ],
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
          <Toaster />
          <DecomposePage />
        </QueryClientProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('DecomposePage', () => {
  it('renders 7 operation type cards on initial load', () => {
    renderPage()
    expect(screen.getByText('Office Move')).toBeInTheDocument()
    expect(screen.getByText('Full Fit-Out')).toBeInTheDocument()
    expect(screen.getByText('Floor Renovation')).toBeInTheDocument()
    expect(screen.getByText('Canteen Setup')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('Space Change')).toBeInTheDocument()
    expect(screen.getByText('Vendor Coordination')).toBeInTheDocument()
  })

  it('transitions to Step 2 form when a catalog card is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /office move/i }))
    expect(screen.getByLabelText('Facilities Request')).toBeInTheDocument()
    expect(screen.getByText('Office Move')).toBeInTheDocument()
  })

  it('returns to catalog when ← Change type is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /office move/i }))
    await user.click(screen.getByRole('button', { name: /change type/i }))
    expect(screen.getByText('Full Fit-Out')).toBeInTheDocument()
    expect(screen.queryByLabelText('Facilities Request')).not.toBeInTheDocument()
  })

  it('shows Zod validation error when submitted with too short a description', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    await user.click(screen.getByRole('button', { name: /office move/i }))
    await user.type(screen.getByLabelText('Facilities Request'), 'tiny')
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)
    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument()
    })
  })

  it('shows success toast after valid form submission', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    await user.click(screen.getByRole('button', { name: /office move/i }))
    await user.type(
      screen.getByLabelText('Facilities Request'),
      'Move 40 staff from FP1 to FP2 within six weeks',
    )
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)
    await waitFor(() => {
      expect(screen.getByText(/ai plan complete/i)).toBeInTheDocument()
    })
  })
})
