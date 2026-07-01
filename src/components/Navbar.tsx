import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { logout } from '../services/AuthService'

export default function Navbar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className={`sticky top-0 z-50 border-b border-slate-200 bg-white/90 ${session ? 'shadow-sm' : ''} backdrop-blur`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600">
            Sistema Turnos
          </Link>
          {session && (
            <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base">
              {pathname === '/mis-turnos' ? (
                <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                  Inicio
                </Link>
              ) : (
                <Link to="/mis-turnos" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                  Mis Turnos
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
