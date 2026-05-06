import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../context/AuthContext'
import { LoginPage } from '../pages/LoginPage'
import { server } from './server'
import { http, HttpResponse } from 'msw'

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Toaster />
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the sign-in form by default', () => {
    renderLogin()
    // Use exact label text to avoid matching aria-label on the toggle button
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('SpaceMind OS')).toBeInTheDocument()
  })

  it('switches to register mode when Create Account tab is clicked', async () => {
    const user = userEvent.setup()
    renderLogin()

    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument()

    const createAccountTab = screen.getAllByRole('button', { name: /create account/i })[0]
    await user.click(createAccountTab)

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
  })

  it('toggles password visibility via the show/hide button', async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: /hide password/i }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('persists token to localStorage after successful login', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(screen.getByLabelText('Email'), 'test@spacemind.co')
    await user.type(screen.getByLabelText('Password'), 'password123')

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(localStorage.getItem('sm_access_token')).toBe('mock-token-abc123')
    })
  })

  it('does not persist token when login API returns 401', async () => {
    server.use(
      http.post('/auth/login', () => {
        return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
      }),
    )

    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(localStorage.getItem('sm_access_token')).toBeNull()
    })
  })

  it('redirects to dashboard path after successful login', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(screen.getByLabelText('Email'), 'test@spacemind.co')
    await user.type(screen.getByLabelText('Password'), 'password123')

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(submitBtn)

    // After login, user data is stored alongside the token
    await waitFor(() => {
      const stored = localStorage.getItem('sm_user')
      expect(stored).not.toBeNull()
      const user = JSON.parse(stored!)
      expect(user.email).toBe('test@spacemind.co')
    })
  })
})
