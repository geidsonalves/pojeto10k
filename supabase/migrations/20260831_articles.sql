create extension if not exists pgcrypto;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid,
  keyword_id uuid,
  title text not null,
  slug text,
  meta_description text,
  excerpt text,
  content text not null default '',
  primary_keyword text,
  secondary_keywords jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  word_count integer not null default 0,
  seo_score integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles add column if not exists site_id uuid;
alter table public.articles add column if not exists keyword_id uuid;
alter table public.articles add column if not exists title text;
alter table public.articles add column if not exists slug text;
alter table public.articles add column if not exists meta_description text;
alter table public.articles add column if not exists excerpt text;
alter table public.articles add column if not exists content text default '';
alter table public.articles add column if not exists primary_keyword text;
alter table public.articles add column if not exists secondary_keywords jsonb default '[]'::jsonb;
alter table public.articles add column if not exists faq jsonb default '[]'::jsonb;
alter table public.articles add column if not exists word_count integer default 0;
alter table public.articles add column if not exists seo_score integer default 0;
alter table public.articles add column if not exists status text default 'draft';
alter table public.articles add column if not exists created_at timestamptz default now();
alter table public.articles add column if not exists updated_at timestamptz default now();

create index if not exists articles_site_id_idx on public.articles(site_id);
create index if not exists articles_keyword_id_idx on public.articles(keyword_id);
create unique index if not exists articles_keyword_id_unique_idx
  on public.articles(keyword_id)
  where keyword_id is not null;
