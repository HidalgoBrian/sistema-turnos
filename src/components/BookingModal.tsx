import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { startOfDay, endOfDay, setHours, setMinutes, setSeconds, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { supabase } from '../lib/supabase'
import type { Service } from '../types/Service'
import type { AppointmentData } from '../types/AppointmentData'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service | null
  onBookingSuccess: () => void
}

const LAST_SLOT_HOUR = 18
const isTodayPastCutoff = () => new Date().getHours() >= LAST_SLOT_HOUR
const getInitialDate = () => isTodayPastCutoff() ? new Date(Date.now() + 86400000) : new Date()

export default function BookingModal({ isOpen, onClose, service, onBookingSuccess }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getInitialDate())
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])
  const [isSuccess, setIsSuccess] = useState(false)

  const handleClose = () => {
    setIsSuccess(false)
    onClose()
  }

  // Generate some time slots (e.g., every 30 mins from 09:00 to 18:00)
  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = Math.floor(9 + i / 2)
    const minute = (i % 2 === 0) ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
  })

  // Check for unavailable slots when date, service, or modal opens
  useEffect(() => {
    const fetchUnavailableSlots = async () => {
      if (!isOpen || !service || !selectedDate) return

      setCheckingAvailability(true)
      try {
        const start = startOfDay(selectedDate).toISOString()
        const end = endOfDay(selectedDate).toISOString()

        const { data, error: fetchError } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('service_id', service.id)
          .gte('appointment_date', start)
          .lte('appointment_date', end)
          .neq('status', 'cancelled')

        if (fetchError) throw fetchError

        if (data) {
          const slots = data.map((app: AppointmentData) => {
            const d = new Date(app.appointment_date)
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
          })
          setUnavailableSlots(slots)
        }
      } catch (err) {
        console.error('Error fetching availability:', err)
      } finally {
        setCheckingAvailability(false)
      }
    }

    fetchUnavailableSlots()
  }, [selectedDate, service, isOpen])

  const handleBooking = async () => {
    if (!service || !selectedDate || !selectedTime) return

    setLoading(true)
    setError(null)

    try {
      // Parse date and time
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const appointmentDate = setSeconds(setMinutes(setHours(startOfDay(selectedDate), hours), minutes), 0)

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found. Please log in again.')

      const { data: newAppointment, error: bookingError } = await supabase
        .from('appointments')
        .insert({
          user_id: session.user.id,
          service_id: service.id,
          appointment_date: appointmentDate.toISOString(),
          status: 'pending'
        })
        .select('id')
        .single()

      if (bookingError) throw bookingError

      supabase.functions.invoke('send-confirmation', {
        body: { appointmentId: newAppointment.id }
      }).catch((err) => {
        console.error('Error sending confirmation email:', err)
      })

      setIsSuccess(true)
      setTimeout(() => {
        onBookingSuccess()
        handleClose()
      }, 3000)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('Ocurrió un error al realizar la reserva.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                    <DialogTitle as="h3" className="text-lg font-bold leading-6 text-gray-900">
                    {isSuccess ? 'Reserva Confirmada' : `Reservar ${service?.name}`}
                  </DialogTitle>
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {isSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <p className="text-xl font-semibold text-gray-900">¡Reserva realizada con éxito!</p>
                    <p className="text-gray-600">
                      {format(selectedDate!, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })} a las {selectedTime} hs
                    </p>
                    <p className="text-sm text-gray-400">Cerrando automáticamente...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Calendar Section */}
                    <div className="flex justify-center border rounded-lg p-2 bg-gray-50">
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        locale={es}
                        disabled={(date) => {
                          const today = new Date()
                          const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                          const isPast = date < startOfToday
                          const isTodayPastCutoff = date.getTime() === startOfToday.getTime() && today.getHours() >= LAST_SLOT_HOUR
                          return isPast || isTodayPastCutoff
                        }}
                        className="m-0"
                      />
                    </div>

                    {/* Time Slots Section */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium text-gray-700">Seleccioná un horario:</p>
                        {checkingAvailability && <span className="text-xs text-indigo-600 animate-pulse">Consultando...</span>}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((slot) => {
                          const isUnavailable = unavailableSlots.includes(slot)
                          const isSelected = selectedTime === slot

                          return (
                            <button
                              key={slot}
                              disabled={isUnavailable || checkingAvailability}
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                                isUnavailable
                                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={handleClose}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={loading || checkingAvailability || !selectedDate || unavailableSlots.includes(selectedTime)}
                        onClick={handleBooking}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Reservando...' : 'Confirmar Reserva'}
                      </button>
                    </div>
                  </div>
                )}
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
