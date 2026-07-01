export interface Appointment {
  id: string
  appointment_date: string
  created_at: string
  status: string
  services: { name: string } | { name: string }[] | null
}
