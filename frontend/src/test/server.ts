import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { UserOut } from '../types'

const mockUser: UserOut = {
  id: 'user-1',
  email: 'test@spacemind.co',
  full_name: 'Test User',
  role: 'facilities_manager',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
}

export const server = setupServer(
  http.post('/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-token-abc123',
      token_type: 'bearer',
      user: mockUser,
    })
  }),

  http.post('/auth/register', () => {
    return HttpResponse.json({
      access_token: 'mock-token-abc123',
      token_type: 'bearer',
      user: mockUser,
    })
  }),

  http.get('/api/v1/locations', () => {
    return HttpResponse.json({
      locations: [
        {
          id: 'FP1_HQ_SouthAfrica',
          country: 'South Africa',
          tenure: 'owned',
          landlord_required: false,
          notes: '',
        },
        {
          id: 'FP2_Cape_Town',
          country: 'South Africa',
          tenure: 'rented',
          landlord_required: true,
          notes: '',
        },
      ],
    })
  }),

  http.post('/api/v1/decompose', () => {
    return HttpResponse.json({
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
        {
          name: 'Planning',
          order: 1,
          tasks: [],
          status: 'pending',
        },
      ],
      total_tasks: 8,
      key_risks: ['Timeline risk'],
      recommendations: [],
      landlord_items: [],
      compliance_notes: [],
      metadata: {},
    })
  }),
)
