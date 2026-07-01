import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Auth from '../../components/Auth'

describe('Componente Auth', () => {
    it('renderiza correctamente el formulario de inicio de sesión por defecto', () => {
        render(<Auth />)

        // Check the title is displayed
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Iniciar Sesión')

        // Check inputs exist
        expect(screen.getByPlaceholderText('Tu correo electrónico')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
    })

    it('cambia a la vista de registro al hacer clic en el botón inferior', () => {
        render(<Auth />)

        // Find the toggle button and click it
        const toggleButton = screen.getByText('¿No tenés cuenta? Registrate')
        fireEvent.click(toggleButton)

        // Check the heading changed
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Crear Cuenta')
    })
})