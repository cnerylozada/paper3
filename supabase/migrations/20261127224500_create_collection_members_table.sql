-- users and collections are many to many: a user creates and belongs to many
-- collections, and a collection has many members. This is the join table. The
-- creator is also a member, flagged with is_creator (a solo collection has just
-- that one row), so "the collections of a user" is one query
create table public.collection_members (
  collection_id uuid not null references public.collections(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  is_creator boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (collection_id, user_id)
);

create index collection_members_user_id_idx
  on public.collection_members (user_id);

-- One creator per collection at most
create unique index collection_members_one_creator_idx
  on public.collection_members (collection_id)
  where is_creator;

-- Same as users: only the server (secret key) reads or writes
alter table public.collection_members enable row level security;
revoke all on public.collection_members from anon, authenticated;
