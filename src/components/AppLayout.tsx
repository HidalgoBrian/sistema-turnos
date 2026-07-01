import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import HomePage from '../pages/HomePage'
import MyAppointmentsPage from '../pages/MyAppointmentsPage'
import Navbar from './Navbar'
import Footer from './Footer'

export default function AppLayout() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 animate-pulse">Cargando...</p></div>
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mis-turnos" element={<MyAppointmentsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
