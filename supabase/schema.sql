create extension if not exists pgcrypto;

create table if not exists public.resume_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique,
  theme text not null default 'aurora',
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  basics jsonb not null default '{}'::jsonb,
  experiences jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  awards jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  campus jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists resume_profiles_slug_idx on public.resume_profiles (slug);

create or replace function public.handle_resume_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists resume_profiles_set_updated_at on public.resume_profiles;
create trigger resume_profiles_set_updated_at
before update on public.resume_profiles
for each row
execute function public.handle_resume_profiles_updated_at();

alter table public.resume_profiles enable row level security;

drop policy if exists "Users can read their own resume or public resumes" on public.resume_profiles;
create policy "Users can read their own resume or public resumes"
on public.resume_profiles
for select
using (auth.uid() = user_id or visibility = 'public');

drop policy if exists "Users can insert their own resume" on public.resume_profiles;
create policy "Users can insert their own resume"
on public.resume_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own resume" on public.resume_profiles;
create policy "Users can update their own resume"
on public.resume_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own resume" on public.resume_profiles;
create policy "Users can delete their own resume"
on public.resume_profiles
for delete
using (auth.uid() = user_id);

create table if not exists public.resumes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null,
  data jsonb not null default '{}'::jsonb,
  markdown text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists resumes_slug_idx on public.resumes (slug);

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
before update on public.resumes
for each row
execute function public.handle_resume_profiles_updated_at();

alter table public.resumes enable row level security;

drop policy if exists "Users can read their own resumes" on public.resumes;
create policy "Users can read their own resumes"
on public.resumes
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own resumes" on public.resumes;
create policy "Users can insert their own resumes"
on public.resumes
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own resumes" on public.resumes;
create policy "Users can update their own resumes"
on public.resumes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own resumes" on public.resumes;
create policy "Users can delete their own resumes"
on public.resumes
for delete
using (auth.uid() = user_id);
