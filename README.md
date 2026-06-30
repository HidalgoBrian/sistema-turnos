# Sistema de Turnos

Aplicación web para reservar turnos de barbería. Los usuarios pueden registrarse, elegir un servicio, seleccionar día y horario, recibir un email de confirmación y consultar sus reservas desde la sección "Mis Turnos".

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript |
| Build | Vite 8 |
| Estilos | Tailwind CSS 4 |
| UI | Headless UI + React DayPicker |
| Ruteo | React Router v7 |
| Backend | Supabase |
| Auth | Supabase Auth |
| Email | Supabase Edge Functions + SendPigeon |
| Testing | Vitest + Testing Library |

## Funcionalidades

- Registro e inicio de sesión con email y contraseña.
- Navbar y footer globales.
- Vista de servicios disponibles.
- Modal de reserva con calendario y horarios.
- Validación de horarios ya ocupados.
- Email de confirmación al reservar.
- Página para confirmar el turno desde el link del email.
- Vista "Mis Turnos" con filtros por estado.
- Cancelación de turnos pendientes o confirmados.
- Limpieza automática visual de turnos pendientes vencidos.

## Servicios actuales

La tabla `services` contiene estos servicios de barbería:

| Servicio | Duración | Precio |
|---|---:|---:|
| Perfilado de barba | 20 min | $7000 |
| Corte de pelo | 30 min | $10000 |
| Corte + barba | 45 min | $13000 |
| Corte premium | 60 min | $16000 |

## Estructura

```txt
src/
├── components/
│   ├── Auth.tsx
│   ├── BookingModal.tsx
│   ├── Footer.tsx
│   └── Navbar.tsx
├── lib/
│   ├── auth-context.tsx
│   └── supabase.ts
├── pages/
│   ├── ConfirmPage.tsx
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   └── MyAppointmentsPage.tsx
└── tests/

supabase/
├── deno.json
├── tsconfig.json
└── functions/
    ├── confirm-appointment/
    └── send-confirmation/

database/
└── schema.sql
```

## Flujo principal

1. El usuario inicia sesión con Supabase Auth.
2. Selecciona un servicio desde la home.
3. Elige día y horario en el modal de reserva.
4. Se crea un registro en `appointments` con estado `pending`.
5. La función `send-confirmation` envía un email con el link de confirmación.
6. El email muestra el servicio y la fecha de reserva. No muestra la hora para evitar diferencias de zona horaria.
7. El usuario confirma desde `/confirmar?token=...`.
8. La función `confirm-appointment` marca el turno como `confirmed`.
9. En "Mis Turnos" el usuario ve el servicio reservado, la fecha, el horario y el estado.

## Variables de entorno

Copiar el archivo `.env.example`, renombrarlo a `.env.local` y completar las variables públicas del frontend con las claves propias de Supabase.

```bash
cp .env.example .env.local
```

Variables necesarias para correr el frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Estos valores no van en `.env.local`. Se configuran como custom secrets dentro de Supabase para que los usen las Edge Functions:

```env
SENDPIGEON_API_KEY=
APP_URL=
```

`FROM_EMAIL` es opcional. Si no se configura, la función usa `onboarding@sendpigeon-sandbox.dev` como remitente por defecto.

Supabase inyecta automáticamente variables como `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` dentro de las Edge Functions. No hace falta cargarlas manualmente como custom secrets.

## Instalación y ejecución local

Para correr el proyecto localmente alcanza con instalar dependencias, configurar `.env.local` y levantar Vite. Si se quiere usar un proyecto propio de Supabase, primero hay que ejecutar el script SQL incluido en el repositorio.

### Opción 1: usar el Supabase existente

1. Clonar el repositorio.

```bash
git clone https://github.com/tuusuario/sistema-turnos.git
cd sistema-turnos
```

2. Instalar dependencias.

```bash
npm install
```

3. Crear `.env.local` desde el ejemplo.

```bash
cp .env.example .env.local
```

4. Completar `.env.local` con las claves públicas de Supabase.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

5. Levantar el frontend.

```bash
npm run dev
```

Con eso alcanza para usar la app localmente conectada al backend de Supabase configurado.

### Opción 2: crear un Supabase propio

Esta opción solo es necesaria si se quiere levantar una copia completa del backend, con base de datos, autenticación y funciones propias.

1. Crear un proyecto vacío en Supabase.
2. Abrir el SQL Editor de Supabase.
3. Copiar y ejecutar el contenido de `database/schema.sql`.
4. Configurar Supabase Auth con email/password.
5. (Opcional) Habilitar inicio de sesión con Google:
   - En Supabase Dashboard → Authentication → Providers → Google, activar el provider.
   - Crear un OAuth Client ID en [Google Cloud Console](https://console.cloud.google.com) (tipo Web Application) y agregar `https://TU_PROJECT_REF.supabase.co/auth/v1/callback` como URI de redirección (reemplazar `TU_PROJECT_REF` por el Project Reference de Supabase).
   - En Supabase Dashboard → Authentication → URL Configuration, agregar en **Redirect URLs**:
     - `http://localhost:5173` (para desarrollo local)
     - `https://sistema-turnos-swart.vercel.app` (para producción)
   - Copiar Client ID y Client Secret en los campos de Supabase.
6. Completar `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
6. Configurar los secrets de las Edge Functions.
7. Desplegar las funciones `send-confirmation` y `confirm-appointment`.

💡 Nota para el evaluador: El script SQL para replicar la estructura de la base de datos en su propio proyecto de Supabase se encuentra en la carpeta `/database/schema.sql`.

Las Edge Functions no corren dentro de Vite. Si se modifican archivos en `supabase/functions`, hay que desplegarlos en Supabase para que impacten en producción.

## Scripts

```bash
npm run dev      # Ejecuta Vite en desarrollo
npm run build    # Compila TypeScript y genera build de producción
npm run lint     # Ejecuta ESLint
npm run test     # Ejecuta tests con Vitest
```

## Supabase Edge Functions

Funciones usadas:

- `send-confirmation`: envía el email de confirmación cuando se crea una reserva.
- `confirm-appointment`: confirma el turno usando el token recibido por email.

Ambas funciones usan `SUPABASE_SERVICE_ROLE_KEY`, por lo que esa clave debe configurarse como secret en Supabase y nunca exponerse en el frontend.

El código de las funciones está incluido en el repositorio:

```txt
supabase/functions/send-confirmation/index.ts
supabase/functions/confirm-appointment/index.ts
```

Para desplegarlas en un proyecto propio de Supabase:

1. Instalar o usar la CLI de Supabase con `npx`.
2. Iniciar sesión.
3. Configurar los secrets necesarios.
4. Ejecutar el deploy de cada función.

```bash
npx supabase login

npx supabase secrets set \
  SENDPIGEON_API_KEY=tu-api-key \
  APP_URL=http://localhost:5173 \
  --project-ref TU_PROJECT_REF

# Opcional (si querés usar un remitente propio):
npx supabase secrets set FROM_EMAIL=tu-remitente --project-ref TU_PROJECT_REF

npx supabase functions deploy send-confirmation --project-ref TU_PROJECT_REF
npx supabase functions deploy confirm-appointment --project-ref TU_PROJECT_REF
```

`TU_PROJECT_REF` es el identificador del proyecto de Supabase. Se puede ver en la URL del dashboard o en `Project Settings > General > Reference ID`.

Importante: si se modifica una función dentro de `supabase/functions`, hay que desplegarla para que el cambio impacte en los emails o confirmaciones reales.

## Notas de base de datos

- `services` almacena las tarjetas de servicios mostradas en la home.
- `appointments` almacena las reservas de usuarios.
- `database/schema.sql` contiene las tablas, relaciones, políticas RLS y datos iniciales.

## Verificación

Antes de commitear cambios, correr:

```bash
npm run lint
npm run build
```

## Herramientas de IA utilizadas

- Gemini: configuración inicial del proyecto Supabase.
- OpenCode: desarrollo y ajustes de frontend, integración con Supabase, Edge Functions, limpieza de datos y correcciones de lint/build.
