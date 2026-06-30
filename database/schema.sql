-- Schema para replicar la base de datos del Sistema de Turnos en Supabase.
-- Ejecutar este archivo completo desde el SQL Editor de Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  appointment_date timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  confirmation_token uuid not null unique default gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_id_idx on public.appointments(user_id);
create index if not exists appointments_service_id_idx on public.appointments(service_id);
create index if not exists appointments_date_idx on public.appointments(appointment_date);
create index if not exists appointments_confirmation_token_idx on public.appointments(confirmation_token);

alter table public.services enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "Services are readable by everyone" on public.services;
create policy "Services are readable by everyone"
on public.services
for select
to anon, authenticated
using (true);

drop policy if exists "Users can read their appointments" on public.appointments;
create policy "Users can read their appointments"
on public.appointments
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their appointments" on public.appointments;
create policy "Users can create their appointments"
on public.appointments
for insert
to authenticated
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Users can update their appointments" on public.appointments;
create policy "Users can update their appointments"
on public.appointments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.services (name, description, duration_minutes, price)
values
  ('Perfilado de barba', 'Diseño, rebaje y terminación de barba con navaja.', 20, 7000),
  ('Corte de pelo', 'Corte clásico o moderno con terminación prolija.', 30, 10000),
  ('Corte + barba', 'Corte completo con arreglo y perfilado de barba.', 45, 13000),
  ('Corte premium', 'Corte, lavado y styling final para un acabado superior.', 60, 16000)
on conflict do nothing;
