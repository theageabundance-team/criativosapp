-- ==========================================================
-- Pastas de organizacao dos criativos (ex: "Oferta X - Frances")
-- Rode isso no SQL Editor do Supabase
-- ==========================================================

create table folders (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create index folders_owner_idx on folders(owner_id);

alter table folders enable row level security;

create policy "owner full access - folders"
  on folders for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

alter table creatives
  add column folder_id uuid references folders(id) on delete set null;

create index creatives_folder_idx on creatives(folder_id);
