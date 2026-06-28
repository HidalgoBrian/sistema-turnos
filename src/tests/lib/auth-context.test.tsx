import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'

function TestConsumer() {
  const { session, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  return <div>{session ? `Logged in as ${session.user.email}` : 'Not logged in'}</div>
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provee sesión nula inicialmente mientras carga', () => {
    (supabase.auth.getSession as any).mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('provee sesión cuando el usuario está autenticado', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'u-1', email: 'user@test.com' } } },
      error: null,
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Logged in as user@test.com')).toBeInTheDocument()
    })
  })

  it('provee sesión nula cuando no hay sesión', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
  })

  it('se suscribe a cambios de autenticación', () => {
    const onAuthChangeSpy = supabase.auth.onAuthStateChange as any

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(onAuthChangeSpy).toHaveBeenCalled()
  })
})
