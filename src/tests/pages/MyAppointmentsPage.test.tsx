import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MyAppointmentsPage from '../../pages/MyAppointmentsPage'
import { mockQuery } from '../test-utils'
import { supabase } from '../../lib/supabase'

function renderPage() {
  return render(
    <MemoryRouter>
      <MyAppointmentsPage />
    </MemoryRouter>
  )
}

describe('MyAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra lista vacía cuando no hay turnos', async () => {
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValue(mockQuery([]))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('No tenés turnos reservados.')).toBeInTheDocument()
    })
  })

  it('renderiza los turnos correctamente', async () => {
    const mockFrom = supabase.from as any
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const mockAppointments = [
      {
        id: 'app-1',
        appointment_date: futureDate,
        created_at: new Date().toISOString(),
        status: 'pending',
        services: [{ name: 'Corte' }],
      },
      {
        id: 'app-2',
        appointment_date: futureDate,
        created_at: new Date().toISOString(),
        status: 'confirmed',
        services: [{ name: 'Coloración' }],
      },
    ]
    mockFrom.mockReturnValue(mockQuery(mockAppointments))

    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('Corte')).toHaveLength(1)
      expect(screen.getByText('Coloración')).toBeInTheDocument()
    })
  })

  it('muestra estado Pendiente para turnos futuros', async () => {
    const mockFrom = supabase.from as any
    const app = {
      id: 'app-1',
      appointment_date: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      status: 'pending',
      services: [{ name: 'Corte' }],
    }
    mockFrom.mockReturnValue(mockQuery([app]))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })
  })

  it('muestra estado Confirmado para turnos confirmados futuros', async () => {
    const mockFrom = supabase.from as any
    const app = {
      id: 'app-1',
      appointment_date: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      status: 'confirmed',
      services: [{ name: 'Corte' }],
    }
    mockFrom.mockReturnValue(mockQuery([app]))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Confirmado')).toBeInTheDocument()
    })
  })

  it('muestra estado Vencido para turnos pendientes pasados', async () => {
    const mockFrom = supabase.from as any
    const app = {
      id: 'app-1',
      appointment_date: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 60000).toISOString(),
      status: 'pending',
      services: [{ name: 'Corte' }],
    }
    mockFrom.mockReturnValue(mockQuery([app]))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Vencido')).toBeInTheDocument()
    })
  })

  it('auto-cancela turnos pendientes con más de 5 minutos', async () => {
    const mockFrom = supabase.from as any
    const app = {
      id: 'app-old',
      appointment_date: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date(Date.now() - 600000).toISOString(),
      status: 'pending',
      services: [{ name: 'Corte' }],
    }
    mockFrom.mockReturnValue(mockQuery([app]))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Cancelado')).toBeInTheDocument()
    })
  })
})
