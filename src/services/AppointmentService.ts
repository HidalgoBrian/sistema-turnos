import { supabase } from '../lib/supabase'
import { AppointmentStatus } from '../types/AppointmentStatusEnum'
import type { Appointment } from '../types/AppointmentType'

export async function getAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, appointment_date, created_at, status, services(name)')
    .eq('user_id', userId)
    .order('appointment_date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createAppointment(data: {
  user_id: string
  service_id: string
  appointment_date: string
}) {
  const { data: newAppointment, error } = await supabase
    .from('appointments')
    .insert({ ...data, status: AppointmentStatus.Pending })
    .select('id')
    .single()
  if (error) throw error
  return newAppointment
}

export async function cancelAppointment(id: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: AppointmentStatus.Cancelled })
    .eq('id', id)
  if (error) throw error
}

export async function cancelExpiredAppointments(ids: string[]) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: AppointmentStatus.Cancelled })
    .in('id', ids)
  if (error) throw error
}

export async function getBookedSlots(serviceId: string, start: string, end: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date')
    .eq('service_id', serviceId)
    .gte('appointment_date', start)
    .lte('appointment_date', end)
    .neq('status', AppointmentStatus.Cancelled)
  if (error) throw error
  return (data || []).map((app: { appointment_date: string }) => {
    const d = new Date(app.appointment_date)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  })
}

export async function sendConfirmation(appointmentId: string) {
  await supabase.functions.invoke('send-confirmation', {
    body: { appointmentId },
  }).catch((err) => {
    console.error('Error sending confirmation email:', err)
  })
}

export async function confirmAppointment(token: string) {
  const { data, error } = await supabase.functions.invoke('confirm-appointment', { body: { token } })
  if (error) throw error
  return typeof data === 'string' ? JSON.parse(data) : data
}
