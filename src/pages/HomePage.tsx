import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BookingModal from '../components/BookingModal'

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
}

export default function HomePage() {
  const navigate = useNavigate()
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div className="text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Reserva tu Turno
          </h1>
          <p className="text-lg text-gray-600">
            Seleccioná el servicio que necesitás y agendá en segundos.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/mis-turnos')}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Mis Turnos
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{service.name}</h2>
            <p className="text-gray-600 mb-6 min-h-[3rem]">{service.description}</p>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-6">
              <span className="flex items-center text-gray-500">
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
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
