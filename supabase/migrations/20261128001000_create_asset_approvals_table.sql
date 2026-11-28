-- Team mode: each member approves the Squads proposal of an asset. One row per
-- member and asset, with the signature of that member's approval transaction
create table public.asset_approvals (
  asset_id uuid not null references public.assets(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  tx_signature text not null unique,
  created_at timestamptz not null default now(),
  primary key (asset_id, user_id)
);

create index asset_approvals_user_id_idx on public.asset_approvals (user_id);

-- Same as users: only the server (secret key) reads or writes
alter table public.asset_approvals enable row level security;
revoke all on public.asset_approvals from anon, authenticated;
