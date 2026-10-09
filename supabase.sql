-- Cole tudo isto no Supabase: menu "SQL Editor" > New query > Run.
create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default '',
  plano jsonb not null,
  atualizado timestamptz not null default now()
);

alter table public.pacientes enable row level security;

-- Cada usuária só enxerga e altera as próprias pacientes.
drop policy if exists "dona_ve_e_edita" on public.pacientes;
create policy "dona_ve_e_edita" on public.pacientes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists pacientes_user_idx on public.pacientes(user_id);
