import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, isPast, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
  id: string
  appointment_date: string
  created_at: string
  status: string
  services: { name: string }[]
}

function getEffectiveStatus(app: Appointment): { label: string; color: string } {
  const date = new Date(app.appointment_date)
  const alreadyPassed = isPast(date)

  switch (app.status) {
    case 'cancelled':
      return { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    case 'confirmed':
      if (alreadyPassed) return { label: 'Completado', color: 'bg-green-100 text-green-800' }
      return { label: 'Confirmado', color: 'bg-green-100 text-green-800' }
    default:
      return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' }
  }
}

const FILTERS = ['Todos', 'Pendiente', 'Confirmado', 'Completado', 'Cancelado'] as const
type Filter = typeof FILTERS[number]

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('Todos')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar este turno?')) return
    setCancellingId(id)
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (!error) {
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' } : app))
      )
    }
    setCancellingId(null)
  }

  useEffect(() => {
    const fetchAndCleanAppointments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
          .from('appointments')
          .select('id, appointment_date, created_at, status, services(name)')
          .eq('user_id', session.user.id)
          .order('appointment_date', { ascending: true })

        if (error) throw error

        const expiryMinutes = 5
        const toCancel: string[] = []

        const cleaned = (data || []).map((app: Appointment) => {
          if (
            app.status === 'pending' &&
            app.created_at &&
            isPast(addMinutes(new Date(app.created_at), expiryMinutes))
          ) {
            toCancel.push(app.id)
            return { ...app, status: 'cancelled' }
          }
          return app
        })

        if (toCancel.length > 0) {
          await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .in('id', toCancel)
        }

        setAppointments(cleaned)
      } catch (err) {
        console.error('Error fetching appointments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAndCleanAppointments()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Cargando tus turnos...</p>
      </div>
    )
  }

  const filteredAppointments =
    filter === 'Todos'
      ? appointments
      : appointments.filter((app) => getEffectiveStatus(app).label === filter)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Mis Turnos</h1>
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Volver
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">
            {appointments.length === 0 ? 'No tenés turnos reservados.' : `No hay turnos con filtro "${filter}".`}
          </p>
          {appointments.length === 0 && (
            <button
              onClick={() => navigate('/')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Reservar un turno
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => {
            const { label, color } = getEffectiveStatus(app)
            return (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{app.services[0]?.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(app.appointment_date), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })} hs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(app.status === 'pending' || app.status === 'confirmed') && !isPast(new Date(app.appointment_date)) && (
                    <button
                      onClick={() => handleCancel(app.id)}
                      disabled={cancellingId === app.id}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {cancellingId === app.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                    {label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
