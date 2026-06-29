# Sistema de Turnos

Aplicación web para gestión de turno. Los clientes pueden registrarse, reservar turnos online y confirmarlos por email.

## Tecnologías y arquitectura

| Capa | Tecnología | Motivo |
|---|---|---|
| **Frontend** | React 19 + TypeScript | Interfaz reactiva, tipado seguro, ecosistema maduro |
| **Build** | Vite 8 | Desarrollo rápido con HMR, build optimizado |
| **Estilos** | Tailwind CSS 4 | Utilidades atómicas, diseño responsive rápido |
| **UI** | Headless UI + DayPicker | Componentes accesibles sin estilo propio, calendario en español |
| **Ruteo** | React Router v7 | Navegación SPA con rutas protegidas |
| **Backend** | Supabase | Base de datos PostgreSQL, autenticación, edge functions |
| **Auth** | Supabase Auth | Registro/login con email y contraseña, sesiones manejadas |
| **Email** | SendPigeon API | Envío de emails transaccionales vía edge functions |
| **Testing** | Vitest + Testing Library | Tests unitarios de componentes y flujos |

### Arquitectura

```
src/
├── components/     # Componentes reutilizables (BookingModal, Auth)
├── pages/          # Páginas (HomePage, LoginPage, MyAppointmentsPage, ConfirmPage)
├── lib/            # Clientes (supabase, auth-context)
└── tests/          # Tests unitarios
supabase/functions/ # Edge Functions (send-confirmation, confirm-appointment)
```

El flujo principal:

1. El usuario se registra/inicia sesión vía Supabase Auth
2. Selecciona un servicio y reserva un turno (fecha + horario)
3. El turno se guarda en PostgreSQL con status `pending` y un `confirmation_token`
4. Una Edge Function envía un email vía SendPigeon con un link de confirmación
5. El usuario hace clic en el link → otra Edge Function pública marca el turno como `confirmed`
6. En "Mis Turnos" se ven los turnos filtrados por el usuario logueado, con estados: Pendiente, Confirmado, Completado, Cancelado

## Herramientas de IA utilizadas

- **Gemini** — Configuración inicial del proyecto Supabase (tablas, columnas, RLS)
- **OpenCode** — Desarrollo del frontend completo: componentes, páginas, ruteo, lógica de negocio, integración con Supabase y SendPigeon, tests unitarios

Ambas herramientas aceleraron significativamente el desarrollo, permitiendo iterar rápido sobre la UI y resolver problemas de integración en minutos.

## Requisitos

- Node.js 18+
- Una cuenta en [Supabase](https://supabase.com) (gratuita)
- Una cuenta en [SendPigeon](https://sendpigeon.dev) (gratuita, 3.000 emails/mes)

## Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tuusuario/sistema-turnos.git
cd sistema-turnos

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env.local con:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# 4. Iniciar en desarrollo
npm run dev
```

### Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ejecutar en SQL Editor las migraciones necesarias (tabla `appointments` con columnas `confirmation_token` y `confirmed_at`)
3. Desactivar "Confirm email" en Authentication → Providers → Email (para desarrollo)
4. Crear dos Edge Functions:
   - `send-confirmation` — envía email al reservar
   - `confirm-appointment` — pública, confirma el turno
5. Configurar los secrets en las Edge Functions:
   - `SENDPIGEON_API_KEY` — API key de SendPigeon
   - `FROM_EMAIL` — dirección verificada en SendPigeon (o `onboarding@sendpigeon-sandbox.dev` para pruebas)
   - `APP_URL` — URL de la app (`https://sistema-turnos-swart.vercel.app`)

### Configurar SendPigeon

1. Crear cuenta en [SendPigeon](https://sendpigeon.dev) (3.000 emails/mes gratis, solo email + contraseña)
2. Ir a API Keys y crear una clave (`sk_live_...`)
3. Para pruebas: usar el sandbox `sendpigeon-sandbox.dev` como remitente (solo llega a tu email)
4. Para producción: verificar un dominio propio en SendPigeon
5. Agregar `SENDPIGEON_API_KEY` como secret en la Edge Function `send-confirmation`

## Scripts disponibles

```bash
npm run dev       # Desarrollo con HMR
npm run build     # Build de producción
npm run lint      # ESLint
npm test          # Tests unitarios
```

## Próximos pasos

- Panel admin para gestionar turnos (Completado / vencido)
- Verificar dominios para enviar emails a cualquier destinatario
- Deploy a producción (Vercel, Netlify, etc.)
