import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RequestForm } from '../components/decompose/RequestForm'
import type { DecompositionRequest } from '../types'

vi.mock('../hooks/useDecompose', () => ({
  useLocations: () => ({
    data: [{ id: 'FP1_HQ_SouthAfrica', country: 'South Africa', tenure: 'owned', landlord_required: false, notes: '' }],
  }),
  useDecompose: () => ({ mutate: vi.fn(), isPending: false }),
}))

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

// Use an untyped mock and cast calls at assertion sites to avoid Vitest 3 API changes
type SubmitFn = (req: DecompositionRequest, multiAgent: boolean) => void

function renderForm(onSubmit: ReturnType<typeof vi.fn> = vi.fn()) {
  return {
    onSubmit,
    ...render(
      <QueryClientProvider client={makeQc()}>
        <RequestForm onSubmit={onSubmit as SubmitFn} isLoading={false} />
      </QueryClientProvider>,
    ),
  }
}

describe('RequestForm', () => {
  it('renders core form fields', () => {
    renderForm()
    expect(screen.getByLabelText('Facilities Request')).toBeInTheDocument()
    expect(screen.getByLabelText('Location')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate execution plan/i })).toBeInTheDocument()
  })

  it('shows a validation error when request text is too short', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()

    await user.type(screen.getByLabelText('Facilities Request'), 'too short')

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument()
    })
  })

  it('does not call onSubmit when validation fails', async () => {
    const user = userEvent.setup()
    const { onSubmit, container } = renderForm()

    await user.type(screen.getByLabelText('Facilities Request'), 'tiny')

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup()
    const { onSubmit, container } = renderForm()

    await user.type(
      screen.getByLabelText('Facilities Request'),
      'Move 40 staff from FP1 to FP2 within six weeks',
    )

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce()
    })

    const [req, multiAgent] = onSubmit.mock.calls[0] as [DecompositionRequest, boolean]
    expect(req.request_text).toBe('Move 40 staff from FP1 to FP2 within six weeks')
    expect(req.location_id).toBe('FP1_HQ_SouthAfrica')
    expect(multiAgent).toBe(false)
  })

  it('enables Deep Analysis mode and updates submit button label', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()

    // Toggle is off initially — submit says "Generate Execution Plan"
    expect(container.querySelector('button[type="submit"]')?.textContent).toContain('Generate Execution Plan')

    await user.click(screen.getByRole('button', { name: /deep analysis mode/i }))

    // "ON" badge should appear inside the toggle
    expect(screen.getByText('ON')).toBeInTheDocument()
    // Submit button changes to "Deep Analysis"
    expect(container.querySelector('button[type="submit"]')?.textContent).toContain('Deep Analysis')
  })

  it('calls onSubmit with multiAgent=true when Deep Analysis is enabled', async () => {
    const user = userEvent.setup()
    const { onSubmit, container } = renderForm()

    await user.click(screen.getByRole('button', { name: /deep analysis mode/i }))

    await user.type(
      screen.getByLabelText('Facilities Request'),
      'Move 40 staff from FP1 to FP2 within six weeks',
    )

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce()
    })

    const [, multiAgent] = onSubmit.mock.calls[0] as [DecompositionRequest, boolean]
    expect(multiAgent).toBe(true)
  })

  it('disables submit and inputs when isLoading=true', () => {
    const { container } = render(
      <QueryClientProvider client={makeQc()}>
        <RequestForm onSubmit={vi.fn()} isLoading={true} />
      </QueryClientProvider>,
    )
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    const textarea = screen.getByLabelText('Facilities Request') as HTMLTextAreaElement
    expect(submitBtn).toBeDisabled()
    expect(textarea).toBeDisabled()
  })

  it('fills textarea from an example chip', async () => {
    const user = userEvent.setup()
    renderForm()

    const moveChip = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Move 40 staff'),
    )
    expect(moveChip).toBeDefined()
    await user.click(moveChip!)

    const textarea = screen.getByLabelText('Facilities Request') as HTMLTextAreaElement
    expect(textarea.value).toContain('Move 40 staff')
  })
})
