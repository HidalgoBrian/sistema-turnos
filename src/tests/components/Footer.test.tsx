import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Footer from '../../components/Footer'

describe('Footer', () => {
  it('renderiza el año actual', () => {
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(year.toString()))).toBeInTheDocument()
  })

  it('muestra el texto de derechos reservados', () => {
    render(<Footer />)
    expect(screen.getByText(/sistema de turnos/i)).toBeInTheDocument()
  })
})