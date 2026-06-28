import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Auth from '../../components/Auth'

describe('Componente Auth', () => {
    it('renderiza correctamente el formulario de inicio de sesión por defecto', () => {
        render(<Auth />)

        // Verificamos que el título esté en pantalla
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Iniciar Sesión')

        // Verificamos que los inputs existan
        expect(screen.getByPlaceholderText('Tu correo electrónico')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
    })

    it('cambia a la vista de registro al hacer clic en el botón inferior', () => {
        render(<Auth />)

        // Buscamos el botón para cambiar de modo y hacemos clic
        const toggleButton = screen.getByText('¿No tenés cuenta? Registrate')
        fireEvent.click(toggleButton)

        // Verificamos que el título principal haya cambiado
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Crear Cuenta')
    })
})