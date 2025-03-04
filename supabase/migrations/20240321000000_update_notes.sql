-- Drop existing foreign key constraint
alter table public.notes drop constraint notes_user_id_fkey;

-- Create note_color enum if it doesn't exist
do $$ begin
  create type note_color as enum ('yellow', 'blue', 'green', 'pink', 'purple');
exception
  when duplicate_object then null;
end $$;

-- First remove the default constraint
alter table public.notes alter column color drop default;

-- Then modify the column type
alter table public.notes 
  alter column color type note_color using color::note_color;

-- Add back the default with the correct type
alter table public.notes 
  alter column color set default 'yellow'::note_color;

-- Add check constraint for position
alter table public.notes 
  add constraint notes_position_check check (
    position ? 'x' 
    and position ? 'y' 
    and jsonb_typeof(position->'x') = 'number'
    and jsonb_typeof(position->'y') = 'number'
  );

-- Add new foreign key constraint
alter table public.notes 
  add constraint notes_user_id_fkey 
  foreign key (user_id) 
  references public.users(id) 
  on delete cascade;

-- Drop existing RLS policies if they exist
drop policy if exists "Users can view their own notes" on notes;
drop policy if exists "Users can create their own notes" on notes;
drop policy if exists "Users can update their own notes" on notes;
drop policy if exists "Users can delete their own notes" on notes;

-- Create new RLS policies
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