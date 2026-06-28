import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ConfirmPage from '../../pages/ConfirmPage'
import { supabase } from '../../lib/supabase'

function renderWithRoute(token: string | null) {
  const url = token ? `/confirmar?token=${token}` : '/confirmar'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ConfirmPage />
    </MemoryRouter>
  )
}

describe('ConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra error si no hay token', () => {
    renderWithRoute(null)
    expect(screen.getByText('Token de confirmación no válido.')).toBeInTheDocument()
  })

  it('muestra loading mientras confirma', () => {
    renderWithRoute('valid-token')
    expect(screen.getByText('Confirmando tu turno...')).toBeInTheDocument()
  })

  it('muestra éxito cuando la confirmación es exitosa', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: { success: true }, error: null })

    renderWithRoute('valid-token')

    await waitFor(() => {
      expect(screen.getByText('¡Turno confirmado con éxito!')).toBeInTheDocument()
    })
    expect(screen.getByText('Ya podés cerrar esta pestaña')).toBeInTheDocument()
  })

  it('muestra error si el token es inválido', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: { success: false, error: 'Token inválido' }, error: null })

    renderWithRoute('invalid-token')

    await waitFor(() => {
      expect(screen.getByText('Token inválido')).toBeInTheDocument()
    })
  })

  it('muestra error si la función falla', async () => {
    (supabase.functions.invoke as any).mockRejectedValue(new Error('Network error'))

    renderWithRoute('valid-token')

    await waitFor(() => {
      expect(screen.getByText('Error de conexión. Intentalo de nuevo.')).toBeInTheDocument()
    })
  })
})
