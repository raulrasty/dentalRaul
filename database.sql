-- =====================
-- DentalRaúl - Schema
-- =====================

-- PACIENTES
create table pacientes (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  apellidos text not null,
  dni text unique,
  telefono text,
  email text,
  fecha_nacimiento date,
  created_at timestamp default now()
);

-- CITAS
create table citas (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references pacientes(id) on delete cascade,
  fecha date not null,
  hora time not null,
  motivo text,
  especialidad text,
  estado text default 'pendiente' check (estado in ('pendiente', 'completada', 'cancelada')),
  created_at timestamp default now()
);

-- HISTORIALES
create table historiales (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references pacientes(id) on delete cascade,
  cita_id uuid references citas(id) on delete set null,
  descripcion text,
  tratamiento text,
  diente text,
  fecha date default current_date,
  created_at timestamp default now()
);

-- PAGOS
create table pagos (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references pacientes(id) on delete cascade,
  cita_id uuid references citas(id) on delete set null,
  importe numeric(10,2) not null,
  estado text default 'pendiente' check (estado in ('pendiente', 'pagado')),
  fecha date default current_date,
  created_at timestamp default now()
);

-- Desactivar RLS para desarrollo (activar en producción)
alter table pacientes  disable row level security;
alter table citas       disable row level security;
alter table historiales disable row level security;
alter table pagos       disable row level security;