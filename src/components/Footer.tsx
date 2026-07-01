export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} Sistema de Turnos. Todos los derechos reservados.
          </div>
          <div className="flex gap-6">
            <span className="text-sm text-slate-400">Reservas simples, rápidas y seguras</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
