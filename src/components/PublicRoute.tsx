import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import Navbar from './Navbar'
import Footer from './Footer'

export default function PublicRoute({ children }: { children: React.ReactNode }) {
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
