-- Movie Matchmaker schema.
-- Run this once in the Supabase project's SQL editor (or `supabase db push`).
-- All client access goes through the Next.js API routes using the service
-- role key, so RLS is left as deny-all for anon/authenticated on purpose.

create extension if not exists pgcrypto;

do $$ begin
  create type partner_slot as enum ('a', 'b');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum ('movies', 'series');
exception when duplicate_object then null; end $$;

do $$ begin
  create type era_band as enum ('any', 'classic', '2000_2020', 'recent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mood_tag as enum ('light_fun', 'intense_gripping', 'scary', 'romantic', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum (
    'awaiting_partner_b',
    'collecting_preferences',
    'generating_pool',
    'round1_swiping',
    'round2_swiping',
    'final_pick',
    'matched',
    'completed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type swipe_direction as enum ('left', 'right');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type as enum ('movie', 'tv');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  emoji text not null default '🎬',
  created_at timestamptz not null default now()
);

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  partner_a_profile_id uuid not null references profiles (id),
  partner_b_profile_id uuid references profiles (id),
  taste_notes text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  status session_status not null default 'awaiting_partner_b',
  round int not null default 1,
  partner_a_done boolean not null default false,
  partner_b_done boolean not null default false,
  partner_b_joined boolean not null default false,
  final_pick_tmdb_id int,
  final_pick_media_type media_type,
  brief_fields jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists preferences (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  partner_slot partner_slot not null,
  moods mood_tag[] not null default '{}',
  mood_freetext text,
  languages text[] not null default '{}',
  content_type content_type not null,
  min_rating int not null,
  eras era_band[] not null default '{}',
  submitted_at timestamptz not null default now(),
  unique (session_id, partner_slot)
);

create table if not exists titles_cache (
  tmdb_id int not null,
  media_type media_type not null,
  title text not null,
  year int,
  poster_path text,
  synopsis text,
  runtime_minutes int,
  genres text[] not null default '{}',
  tmdb_rating numeric,
  imdb_id text,
  imdb_rating numeric,
  ott_options jsonb not null default '[]',
  ott_fetched_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (tmdb_id, media_type)
);

create table if not exists pool_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  round int not null,
  tmdb_id int not null,
  media_type media_type not null,
  created_at timestamptz not null default now(),
  unique (session_id, round, tmdb_id, media_type)
);

create table if not exists swipes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  round int not null,
  partner_slot partner_slot not null,
  tmdb_id int not null,
  media_type media_type not null,
  direction swipe_direction not null,
  created_at timestamptz not null default now(),
  unique (session_id, round, partner_slot, tmdb_id, media_type)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  round int not null,
  tmdb_id int not null,
  media_type media_type not null,
  matched_at timestamptz not null default now()
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  tmdb_id int not null,
  media_type media_type not null,
  rating int not null check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_couple on sessions (couple_id);
create index if not exists idx_preferences_session on preferences (session_id);
create index if not exists idx_pool_items_session_round on pool_items (session_id, round);
create index if not exists idx_swipes_session_round on swipes (session_id, round);
create index if not exists idx_matches_session on matches (session_id);
create index if not exists idx_ratings_session on ratings (session_id);

alter table profiles enable row level security;
alter table couples enable row level security;
alter table sessions enable row level security;
alter table preferences enable row level security;
alter table titles_cache enable row level security;
alter table pool_items enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table ratings enable row level security;
-- Intentionally no policies: anon/authenticated get zero access, and the
-- service_role key (used only in server-side API routes) bypasses RLS.
