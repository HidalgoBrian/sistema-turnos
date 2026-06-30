import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BookingModal from '../../components/BookingModal'
import { mockQuery } from '../test-utils'
import { supabase } from '../../lib/supabase'

const mockService = {
  id: 'srv-1',
  name: 'Corte',
  description: 'Corte de cabello',
  duration_minutes: 30,
  price: 1500,
}

describe('BookingModal', () => {
  const onClose = vi.fn()
  const onBookingSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function renderModal() {
    const utils = render(
      <BookingModal isOpen={true} onClose={onClose} service={mockService} onBookingSuccess={onBookingSuccess} />
    )
    await waitFor(() => {
      expect(screen.getByText('Confirmar Reserva')).not.toBeDisabled()
    })
    return utils
  }

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <BookingModal isOpen={false} onClose={onClose} service={mockService} onBookingSuccess={onBookingSuccess} />
    )
    expect(container.textContent).not.toContain('Reservar')
  })

  it('renderiza el nombre del servicio cuando está abierto', async () => {
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValue(mockQuery([]))

    render(
      <BookingModal isOpen={true} onClose={onClose} service={mockService} onBookingSuccess={onBookingSuccess} />
    )
    expect(await screen.findByText('Reservar Corte')).toBeInTheDocument()
  })

  it('muestra los horarios disponibles', async () => {
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValue(mockQuery([]))

    render(
      <BookingModal isOpen={true} onClose={onClose} service={mockService} onBookingSuccess={onBookingSuccess} />
    )
    expect(await screen.findByText('09:00')).toBeInTheDocument()
    expect(screen.getByText('18:00')).toBeInTheDocument()
  })

  it('permite seleccionar un horario', async () => {
    const mockFrom = supabase.from as any
    mockFrom.mockReturnValue(mockQuery([]))

    render(
      <BookingModal isOpen={true} onClose={onClose} service={mockService} onBookingSuccess={onBookingSuccess} />
    )
    const slot = await screen.findByText('10:00')
    await act(async () => {
      fireEvent.click(slot)
    })
    await waitFor(() => {
      expect(screen.getByText('10:00').className).toContain('bg-indigo-600')
    })
  })

  it('deshabilita horarios ocupados', async () => {
    const mockFrom = supabase.from as any
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(11, 0, 0, 0)
    mockFrom.mockReturnValue(mockQuery([
      { appointment_date: tomorrow.toISOString() }
    ]))

    render(
      <BookingModal isOpen={true} onClose={onClose} service={mockService} onBookingSuccess={onBookingSuccess} />
    )

    await waitFor(() => {
      const slot = screen.getByText('11:00')
      expect(slot).toBeDisabled()
    })
  })

  it('muestra pantalla de éxito después de reservar', async () => {
    const mockFrom = supabase.from as any
    mockFrom
      .mockReturnValueOnce(mockQuery([]))
      .mockReturnValueOnce(mockQuery({ id: 'new-app-1' }))

    await renderModal()
    fireEvent.click(screen.getByText('Confirmar Reserva'))

    await waitFor(() => {
      expect(screen.getByText('¡Reserva realizada con éxito!')).toBeInTheDocument()
    })
  })

  it('llama a send-confirmation después de reservar', async () => {
    const mockFrom = supabase.from as any
    mockFrom
      .mockReturnValueOnce(mockQuery([]))
      .mockReturnValueOnce(mockQuery({ id: 'new-app-2' }))
    const invokeSpy = supabase.functions.invoke as any

    await renderModal()
    fireEvent.click(screen.getByText('Confirmar Reserva'))

    await waitFor(() => {
      expect(invokeSpy).toHaveBeenCalledWith('send-confirmation', {
        body: { appointmentId: 'new-app-2' }
      })
    })
  })

  it('muestra error si la reserva falla', async () => {
    const mockFrom = supabase.from as any
    mockFrom
      .mockReturnValueOnce(mockQuery([]))
      .mockReturnValueOnce(mockQuery(null, new Error('Database error')))

    await renderModal()
    fireEvent.click(screen.getByText('Confirmar Reserva'))

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument()
    })
  })
})
