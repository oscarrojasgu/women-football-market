-- Women’s Football Market — Stage 1 database foundation
create extension if not exists pgcrypto;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date,
  nationality text,
  position text,
  preferred_foot text,
  agency text,
  created_at timestamptz not null default now()
);

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  league text,
  created_at timestamptz not null default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  publisher text,
  published_at date,
  reliability text not null check (reliability in ('official','reliable_media','specialist','estimate')),
  accessed_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  club_id uuid not null references clubs(id),
  start_date date,
  end_date date,
  annual_salary numeric,
  weekly_salary numeric,
  currency text default 'USD',
  guaranteed boolean,
  option_year boolean,
  status text not null default 'active',
  source_id uuid references sources(id),
  confidence text not null default 'unknown' check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  from_club_id uuid references clubs(id),
  to_club_id uuid references clubs(id),
  transfer_date date,
  transfer_type text not null check (transfer_type in ('permanent','loan','free','trade','release','contract_expiration')),
  fee numeric,
  currency text default 'USD',
  source_id uuid references sources(id),
  confidence text not null default 'unknown' check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text
);

create table if not exists salary_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  season text not null,
  annual_salary numeric,
  weekly_salary numeric,
  currency text default 'USD',
  source_id uuid references sources(id),
  confidence text not null default 'unknown' check (confidence in ('verified','reported','estimated','rumored','unknown')),
  notes text
);

-- Public site should only expose deliberately public records; admin write access comes later.
alter table players enable row level security;
alter table clubs enable row level security;
alter table sources enable row level security;
alter table contracts enable row level security;
alter table transfers enable row level security;
alter table salary_records enable row level security;
