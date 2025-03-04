-- Create enum for note colors
create type note_color as enum ('yellow', 'blue', 'green', 'pink', 'purple');

create table public.notes (
  id uuid not null primary key,
  content text,
  color note_color not null default 'yellow',
  position jsonb not null default '{"x": 0, "y": 0}'::jsonb check (
    position ? 'x' 
    and position ? 'y' 
    and jsonb_typeof(position->'x') = 'number'
    and jsonb_typeof(position->'y') = 'number'
  ),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  user_id uuid not null references public.users(id) on delete cascade
);

-- Enable RLS
alter table public.notes enable row level security;

-- Create policies
create policy "Users can view their own notes" on notes
  for select using (auth.uid() in (
    select id from users where id = user_id
  ));

create policy "Users can create their own notes" on notes
  for insert with check (auth.uid() in (
    select id from users where id = user_id
  ));

create policy "Users can update their own notes" on notes
  for update using (auth.uid() in (
    select id from users where id = user_id
  ));

create policy "Users can delete their own notes" on notes
  for delete using (auth.uid() in (
    select id from users where id = user_id
  ));

-- Create indexes
create index notes_user_id_idx on notes(user_id);
create index notes_created_at_idx on notes(created_at); 