import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import LoginPage from './pages/LoginPage'
import ConfirmPage from './pages/ConfirmPage'
import PublicRoute from './components/PublicRoute'
import AppLayout from './components/AppLayout'

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
