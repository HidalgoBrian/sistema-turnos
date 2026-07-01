const authErrorMap: Record<string, string> = {
  'Invalid login credentials': 'Credenciales inválidas',
  'Email not confirmed': 'Email no confirmado',
  'User already registered': 'El usuario ya está registrado',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Rate limit exceeded': 'Demasiados intentos. Intentalo de nuevo más tarde',
  'Email link is invalid or has expired': 'El enlace es inválido o ha expirado',
  'Invalid email': 'El email no es válido',
  'Email address is empty': 'El email está vacío',
}

const authErrorPatterns: { match: string; translation: string }[] = [
  { match: 'please include', translation: 'El email debe incluir un @' },
  { match: 'is missing', translation: 'El email debe incluir un @' },
  { match: 'invalid format', translation: 'El email no tiene un formato válido' },
  { match: 'at least 6', translation: 'La contraseña debe tener al menos 6 caracteres' },
]

export function translateAuthError(message: string): string {
  if (authErrorMap[message]) return authErrorMap[message]
  const lower = message.toLowerCase()
  for (const { match, translation } of authErrorPatterns) {
    if (lower.includes(match)) return translation
  }
  return message
}
