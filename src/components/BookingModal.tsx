import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { X } from 'lucide-react'
import { startOfDay, setHours, setMinutes, setSeconds } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { supabase } from '../lib/supabase'

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service | null
  onBookingSuccess: () => void
}

export default function BookingModal({ isOpen, onClose, service, onBookingSuccess }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate some time slots (e.g., every 30 mins from 09:00 to 18:00)
  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const hour = Math.floor(9 + i / 2)
    const minute = (i % 2 === 0) ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
  })

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

      const { error: bookingError } = await supabase
        .from('appointments')
        .insert({
          user_id: session.user.id,
          service_id: service.id,
          appointment_date: appointmentDate.toISOString(),
          status: 'pending'
        })

      if (bookingError) throw bookingError

      onBookingSuccess()
      onClose()
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('Ocurrió un error al realizar la reserva.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    Reservar {service?.name}
                  </DialogTitle>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Calendar Section */}
                  <div className="flex justify-center border rounded-lg p-2 bg-gray-50">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="m-0"
                    />
                  </div>

                  {/* Time Slots Section */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Seleccioná un horario:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 text-xs font-medium rounded-md transition-colors ${
                            selectedTime === slot
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={loading || !selectedDate}
                      onClick={handleBooking}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Reservando...' : 'Confirmar Reserva'}
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
