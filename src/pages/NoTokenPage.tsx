import { XCircle } from 'lucide-react'

export default function NoTokenPage() {
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
