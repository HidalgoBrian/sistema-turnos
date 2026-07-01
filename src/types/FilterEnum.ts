export const Filter = {
  Todos: 'Todos',
  Pendiente: 'Pendiente',
  Confirmado: 'Confirmado',
  Completado: 'Completado',
  Cancelado: 'Cancelado',
} as const

export type Filter = (typeof Filter)[keyof typeof Filter]
