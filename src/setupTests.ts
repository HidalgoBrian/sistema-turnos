import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('./lib/supabase', () => {
  const mockQuery = <T>(data: T) => {
    const promise = Promise.resolve({ data, error: null })
    const chain: Record<string, any> = {}
    for (const method of ['select', 'eq', 'gte', 'lte', 'order', 'single', 'insert', 'update', 'in', 'maybeSingle']) {
      chain[method] = vi.fn(() => chain)
    }
    chain.then = promise.then.bind(promise)
    chain.catch = promise.catch.bind(promise)
    return chain
  }

  const supabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-1', email: 'test@test.com' }, access_token: 'fake-token' } },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } }, error: null }),
    },
    from: vi.fn(() => mockQuery([])),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  }

  return { supabase }
})
