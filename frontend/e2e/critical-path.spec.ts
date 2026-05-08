import { test, expect, type Page } from '@playwright/test'

// ── Shared mock data ──────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'user-1',
  email: 'test@spacemind.co',
  full_name: 'Test User',
  role: 'facilities_manager',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
}

const MOCK_RESULT = {
  id: 'decomp-e2e-123',
  created_at: '2025-01-01T00:00:00Z',
  request_summary: 'Move 40 staff from FP1 to FP2',
  original_request: 'Move 40 staff from FP1 to FP2 within 6 weeks',
  request_type: 'office_move',
  priority: 'normal',
  location_context: {
    location_id: 'FP1_HQ_SouthAfrica',
    tenure: 'owned',
    country: 'South Africa',
    landlord_approval_required: false,
  },
  phases: [
    {
      id: 'p1',
      name: 'Planning & Preparation',
      order: 1,
      tasks: [
        {
          id: 't1',
          name: 'Site survey',
          responsible: { party: 'internal' },
          estimated_duration_hours: 4,
          risk_level: 'low',
          status: 'pending',
          landlord_approval_required: false,
        },
      ],
      status: 'pending',
    },
  ],
  total_tasks: 8,
  total_estimated_duration_days: 21,
  key_risks: ['Timeline risk'],
  recommendations: [],
  landlord_items: [],
  compliance_notes: [],
  metadata: {},
}

// ── API mock helper ───────────────────────────────────────────────────────────

async function setupApiMocks(page: Page) {
  await page.route('**/auth/login', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'test-e2e-token',
        token_type: 'bearer',
        user: MOCK_USER,
      }),
    }),
  )

  await page.route('**/api/v1/locations', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        locations: [
          {
            id: 'FP1_HQ_SouthAfrica',
            country: 'South Africa',
            tenure: 'owned',
            landlord_required: false,
            notes: '',
          },
        ],
      }),
    }),
  )

  await page.route('**/api/v1/decompose', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESULT),
    }),
  )

  // Export endpoint — return minimal PDF bytes
  await page.route('**/api/v1/history/**/export**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: Buffer.from('%PDF-1.4 mock pdf content'),
    }),
  )

  // History, analytics, and other background queries — return empty
  await page.route('**/api/v1/history**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], total: 0, limit: 20, offset: 0 }),
    }),
  )

  await page.route('**/api/v1/analytics**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    }),
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Auth guard', () => {
  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})

test.describe('Critical path', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
  })

  test('login navigates to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@spacemind.co')
    await page.getByLabel('Password').fill('password123')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 10_000 })
  })

  test('catalog → form → submit → result renders', async ({ page }) => {
    // Seed token so the page loads as authenticated
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@spacemind.co')
    await page.getByLabel('Password').fill('password123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 10_000 })

    // Navigate to Decompose
    await page.goto('/decompose')

    // Step 1: select Office Move card
    await page.getByRole('button', { name: /office move/i }).click()

    // Step 2: fill and submit the request form
    await page.getByLabel('Facilities Request').fill(
      'Move 40 staff from FP1 to FP2 within the next 6 weeks',
    )
    await page.locator('button[type="submit"]').click()

    // Step 3: verify result view renders
    await expect(page.getByText('Execution Plan Generated')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Planning & Preparation')).toBeVisible()
  })

  test('export PDF triggers a download', async ({ page }) => {
    // Authenticate
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@spacemind.co')
    await page.getByLabel('Password').fill('password123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 10_000 })

    // Reach result view
    await page.goto('/decompose')
    await page.getByRole('button', { name: /office move/i }).click()
    await page.getByLabel('Facilities Request').fill(
      'Move 40 staff from FP1 to FP2 within the next 6 weeks',
    )
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Execution Plan Generated')).toBeVisible({ timeout: 15_000 })

    // Open export dropdown and click PDF
    const downloadPromise = page.waitForEvent('download')
    await page.getByTitle('Export plan').click()
    await page.getByRole('button', { name: /^pdf$/i }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })
})
