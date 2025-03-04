-- Drop existing RLS policies
drop policy if exists "Users can view notes from their organizations" on notes;
drop policy if exists "Users can create notes in their organizations" on notes;
drop policy if exists "Users can update notes from their organizations" on notes;
drop policy if exists "Users can delete notes from their organizations" on notes;
drop policy if exists "Users can view their own notes" on notes;
drop policy if exists "Users can create their own notes" on notes;
drop policy if exists "Users can update their own notes" on notes;
drop policy if exists "Users can delete their own notes" on notes;

-- Drop everything related to notes
drop table if exists public.notes cascade;
drop type if exists note_color cascade;

-- Create note_color enum
create type note_color as enum ('yellow', 'blue', 'green', 'pink', 'purple');

-- Create notes table
create table public.notes (
  id uuid not null,
  content text null,
  color note_color not null default 'yellow'::note_color,
  position jsonb not null default '{"x": 0, "y": 0}'::jsonb check (
    position ? 'x' 
    and position ? 'y' 
    and jsonb_typeof(position->'x') = 'number'
    and jsonb_typeof(position->'y') = 'number'
  ),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  user_id uuid not null,
  constraint notes_pkey primary key (id),
  constraint notes_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade
) tablespace pg_default;

-- Create indexes
create index if not exists notes_user_id_idx 
  on public.notes using btree (user_id) 
  tablespace pg_default;

create index if not exists notes_created_at_idx 
  on public.notes using btree (created_at) 
  tablespace pg_default;

-- Enable RLS
alter table public.notes enable row level security;

-- Create RLS policies that allow all users to access all notes
create policy "Users can view all notes" on notes
  for select using (true);

create policy "Users can create notes" on notes
  for insert with check (auth.uid() = user_id);

create policy "Users can update all notes" on notes
  for update using (true);

create policy "Users can delete all notes" on notes
  for delete using (true); 