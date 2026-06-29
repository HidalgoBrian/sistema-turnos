import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth-context'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import MyAppointmentsPage from './pages/MyAppointmentsPage'
import ConfirmPage from './pages/ConfirmPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 animate-pulse">Cargando...</p></div>
  if (session) return <Navigate to="/" replace />
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function AppLayout() {
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/confirmar" element={<ConfirmPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  )
}
