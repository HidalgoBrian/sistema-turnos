import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, isPast, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Appointment } from '../types/Appointment'
import { Filter } from '../types/FilterEnum'
import { AppointmentStatus } from '../types/AppointmentStatus'

const getServiceName = (app: Appointment) => {
  if (Array.isArray(app.services)) return app.services[0]?.name || 'Servicio reservado'
  return app.services?.name || 'Servicio reservado'
}

function getEffectiveStatus(app: Appointment): { label: string; color: string } {
  const date = new Date(app.appointment_date)
  const alreadyPassed = isPast(date)

  switch (app.status) {
    case AppointmentStatus.Cancelled:
      return { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    case AppointmentStatus.Confirmed:
      if (alreadyPassed) return { label: 'Completado', color: 'bg-green-100 text-green-800' }
      return { label: 'Confirmado', color: 'bg-green-100 text-green-800' }
    default:
      return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' }
  }
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>(Filter.Todos)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    const { error } = await supabase
      .from('appointments')
      .update({ status: AppointmentStatus.Cancelled })
      .eq('id', id)
    if (!error) {
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: AppointmentStatus.Cancelled } : app))
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
            app.status === AppointmentStatus.Pending &&
            app.created_at &&
            isPast(addMinutes(new Date(app.created_at), expiryMinutes))
          ) {
            toCancel.push(app.id)
            return { ...app, status: AppointmentStatus.Cancelled }
          }
          return app
        })

        if (toCancel.length > 0) {
          await supabase
            .from('appointments')
            .update({ status: AppointmentStatus.Cancelled })
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
    filter === Filter.Todos
      ? appointments
      : appointments.filter((app) => getEffectiveStatus(app).label === filter)

  return (
    <><div className="mx-auto max-w-5xl">
      <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-indigo-500">Agenda personal</p>
          <h1 className="text-3xl font-extrabold text-slate-900">Mis Turnos</h1>
          <p className="mt-2 text-slate-500">Consultá, filtrá o cancelá tus próximas reservas.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="rounded-full bg-indigo-50 px-4 py-2 font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
        >
          Volver a reservar
        </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.values(Filter).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-200">
          <p className="mb-4 text-lg text-slate-500">
            {appointments.length === 0 ? 'No tenés turnos reservados.' : `No hay turnos con filtro "${filter}".`}
          </p>
          {appointments.length === 0 && (
            <button
              onClick={() => navigate('/')}
              className="rounded-xl bg-indigo-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
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
                  <p className="font-semibold text-gray-900">{getServiceName(app)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(app.appointment_date), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })} hs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(app.status === AppointmentStatus.Pending || app.status === AppointmentStatus.Confirmed) && !isPast(new Date(app.appointment_date)) && (
                    <button
                      onClick={() => setCancelTarget(app)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancelar
                    </button>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}>
                    {label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>

      <Dialog open={cancelTarget !== null} onClose={() => setCancelTarget(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Cancelar turno
            </DialogTitle>
            <p className="text-gray-600 text-sm">
              {cancelTarget ? (
                <>¿Cancelar el turno de <strong>{getServiceName(cancelTarget)}</strong> del {format(new Date(cancelTarget.appointment_date), "d 'de' MMMM", { locale: es })}?</>
              ) : '¿Cancelar este turno?'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  const id = cancelTarget!.id
                  setCancelTarget(null)
                  handleCancel(id)
                }}
                disabled={cancellingId === cancelTarget?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancellingId === cancelTarget?.id ? 'Cancelando...' : 'Sí, cancelar turno'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>)
}
