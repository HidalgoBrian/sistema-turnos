import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

function NoTokenPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="py-8 space-y-4">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <p className="text-xl font-semibold text-gray-900">Token de confirmación no válido.</p>
          <a href="/" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}

function ConfirmHandler({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.functions.invoke('confirm-appointment', { body: { token } })
      .then(({ data, error }) => {
        console.log('Confirm result:', { data, error })
        const resData = typeof data === 'string' ? JSON.parse(data) : data
        if (error || !resData?.success) {
          setStatus('error')
          setMessage(resData?.error || 'Error al confirmar el turno.')
        } else {
          setStatus('success')
          setMessage('¡Turno confirmado con éxito!')
        }
      })
      .catch((err) => {
        console.error('Confirm catch error:', err)
        setStatus('error')
        setMessage('Error de conexión. Intentalo de nuevo.')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="py-8">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Confirmando tu turno...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <p className="text-xl font-semibold text-gray-900">{message}</p>
            <p className="text-gray-500">Ya podés cerrar esta pestaña</p>
          </div>
        )}
        {status === 'error' && (
          <div className="py-8 space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <p className="text-xl font-semibold text-gray-900">{message}</p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  if (!token) return <NoTokenPage />

  return <ConfirmHandler token={token} />
}
