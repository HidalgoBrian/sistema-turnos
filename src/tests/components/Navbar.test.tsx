import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { AuthProvider } from '../../lib/auth-context'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'

function renderNavbar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  it('muestra el logo', async () => {
    renderNavbar()
    expect(await screen.findByText('BarberiApp')).toBeInTheDocument()
  })

  it('no muestra botones de navegación para usuarios no autenticados', async () => {
    ;(supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null })
    renderNavbar()
    await waitFor(() => {
      expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument()
      expect(screen.queryByText('Mis Turnos')).not.toBeInTheDocument()
      expect(screen.queryByText('Cerrar Sesión')).not.toBeInTheDocument()
    })
  })

  it('muestra Mis Turnos y Cerrar Sesión para usuarios autenticados', async () => {
    ;(supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'u-1', email: 'test@test.com' }, access_token: 'token' } },
      error: null,
    })
    renderNavbar()
    await waitFor(() => {
      expect(screen.getByText('Mis Turnos')).toBeInTheDocument()
      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument()
    })
  })
})