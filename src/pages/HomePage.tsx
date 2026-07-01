import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'
import type { Service } from '../types/Service'

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase.from('services').select('*')
        if (error) throw error
        setServices(data || [])
      } catch (err) {
        if (err instanceof Error) setError(err.message)
        else setError('Ocurrió un error inesperado al cargar los servicios.')
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-gray-500 animate-pulse">Cargando servicios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="mb-14 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 px-6 py-12 text-center text-white shadow-xl sm:px-10 sm:py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-indigo-100">
          Barbería y cuidado personal
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-6xl">
          Reserva tu Turno
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-indigo-50 sm:text-xl">
          Seleccioná el servicio que necesitás y agendá tu cita en cuestión de segundos.
        </p>
      </section>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Servicios disponibles</h2>
          <p className="mt-1 text-slate-500">Elegí una opción para ver los horarios libres.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="mb-2 text-2xl font-bold text-slate-900">{service.name}</h3>
            <p className="mb-6 min-h-[3rem] text-slate-600">{service.description}</p>

            <div className="mb-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="flex items-center text-slate-500">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {service.duration_minutes} min
              </span>
              <span className="text-xl font-black text-indigo-600">${service.price}</span>
            </div>

            <button
              onClick={() => {
                setSelectedService(service)
                setIsModalOpen(true)
              }}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Seleccionar
            </button>
          </div>
        ))}
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
        onBookingSuccess={() => {}}
      />
    </div>
  )
}
