-- ==========================================================
-- CREATIVE OS - schema inicial
-- Rode isso no SQL Editor do seu projeto Supabase
-- ==========================================================

create extension if not exists "uuid-ossp";

-- status possiveis da esteira
create type pipeline_status as enum (
  'em_teste',
  'pre_escala',
  'escalando',
  'pausado'
);

create type platform as enum (
  'meta',
  'tiktok',
  'google',
  'kwai',
  'taboola',
  'outro'
);

-- tabela principal: cada criativo enviado (video/imagem)
create table creatives (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  file_path text not null,        -- caminho no Supabase Storage
  file_type text not null,        -- 'video' | 'image'
  thumbnail_path text,
  platform platform not null default 'meta',
  status pipeline_status not null default 'em_teste',
  ad_account_id text,             -- ex: act_123456789 (Meta), usado pra casar com a Utmify
  external_ad_id text,            -- id do anuncio na plataforma de trafego (pra futuro hook rate/retencao)
  product_name text,              -- casa com productNames da Utmify
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index creatives_owner_idx on creatives(owner_id);
create index creatives_status_idx on creatives(status);

-- historico de mudanca de status (pra saber ha quanto tempo esta em cada fase da esteira)
create table creative_status_history (
  id uuid primary key default uuid_generate_v4(),
  creative_id uuid references creatives(id) on delete cascade not null,
  from_status pipeline_status,
  to_status pipeline_status not null,
  changed_at timestamptz default now()
);

-- snapshot de metricas puxadas da Utmify por criativo/conta de anuncio/periodo
-- (a Utmify da o dado agregado por dashboard/conta; aqui guardamos o snapshot
--  pra nao estourar rate limit e pra montar historico/graficos)
create table utmify_snapshots (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  ad_account_id text,
  product_name text,
  period_from timestamptz not null,
  period_to timestamptz not null,
  currency text default 'BRL',
  spend_cents bigint default 0,
  revenue_gross_cents bigint default 0,
  revenue_net_cents bigint default 0,
  orders_total int default 0,
  orders_approved int default 0,
  profit_cents bigint default 0,
  roas numeric,
  roi numeric,
  avg_ticket_cents bigint,
  cpa_cents bigint,
  raw jsonb, -- resposta crua da Utmify, pra nao perder nada
  fetched_at timestamptz default now()
);

create index utmify_snapshots_owner_idx on utmify_snapshots(owner_id);
create index utmify_snapshots_account_idx on utmify_snapshots(ad_account_id);

-- placeholder para quando plugarmos hook rate / retencao (Meta/TikTok Ads API)
create table creative_engagement_metrics (
  id uuid primary key default uuid_generate_v4(),
  creative_id uuid references creatives(id) on delete cascade not null,
  period_from timestamptz not null,
  period_to timestamptz not null,
  impressions bigint,
  hook_rate numeric,        -- % que assistiu ate os primeiros 3s
  hold_rate numeric,        -- retencao ate o fim / thruplay rate
  avg_watch_time_seconds numeric,
  ctr numeric,
  raw jsonb,
  fetched_at timestamptz default now()
);

-- RLS: cada usuario so ve o que e dele
alter table creatives enable row level security;
alter table creative_status_history enable row level security;
alter table utmify_snapshots enable row level security;
alter table creative_engagement_metrics enable row level security;

create policy "owner full access - creatives"
  on creatives for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner read history"
  on creative_status_history for select
  using (exists (select 1 from creatives c where c.id = creative_id and c.owner_id = auth.uid()));

create policy "owner insert history"
  on creative_status_history for insert
  with check (exists (select 1 from creatives c where c.id = creative_id and c.owner_id = auth.uid()));

create policy "owner full access - utmify snapshots"
  on utmify_snapshots for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner read engagement"
  on creative_engagement_metrics for select
  using (exists (select 1 from creatives c where c.id = creative_id and c.owner_id = auth.uid()));

-- trigger: grava historico automaticamente quando status muda
create or replace function log_status_change() returns trigger as $$
begin
  if (old.status is distinct from new.status) then
    insert into creative_status_history (creative_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger creatives_status_change
  before update on creatives
  for each row execute function log_status_change();

-- bucket de storage pros arquivos de criativo (rode via SQL ou pelo painel Storage)
insert into storage.buckets (id, name, public) values ('creatives', 'creatives', false)
  on conflict (id) do nothing;

create policy "owner access storage"
  on storage.objects for all
  using (bucket_id = 'creatives' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'creatives' and auth.uid()::text = (storage.foldername(name))[1]);
