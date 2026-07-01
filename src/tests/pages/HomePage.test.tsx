import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HomePage from '../../pages/HomePage'
import { supabase } from '../../lib/supabase'
import { mockQuery } from '../test-utils'

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

const mockServices = [
  {
    id: 'srv-1',
    name: 'Corte de pelo',
    description: 'Corte clásico',
    duration_minutes: 30,
    price: 10000,
  },
  {
    id: 'srv-2',
    name: 'Corte + barba',
    description: 'Corte completo con barba',
    duration_minutes: 45,
    price: 13000,
  },
]

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra los servicios cargados', async () => {
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValue(mockQuery(mockServices))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Corte de pelo')).toBeInTheDocument()
      expect(screen.getByText('Corte + barba')).toBeInTheDocument()
    })
  })

  it('muestra el precio y duración de cada servicio', async () => {
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValue(mockQuery(mockServices))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('$10000')).toBeInTheDocument()
      expect(screen.getByText('$13000')).toBeInTheDocument()
      expect(screen.getByText('30 min')).toBeInTheDocument()
      expect(screen.getByText('45 min')).toBeInTheDocument()
    })
  })

  it('muestra el título principal', async () => {
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValue(mockQuery(mockServices))

    renderPage()

    expect(await screen.findByText('Reserva tu Turno')).toBeInTheDocument()
  })
})