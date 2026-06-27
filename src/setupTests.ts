import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))
