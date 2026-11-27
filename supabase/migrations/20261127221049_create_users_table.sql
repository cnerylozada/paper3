create table public.users (
  id uuid primary key default gen_random_uuid(),
  -- Privy user id, e.g. did:privy:...
  privy_id text not null unique,
  -- Embedded Solana wallet (base58)
  wallet_address text not null unique,
  email text unique,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Login is Privy, not Supabase Auth, so auth.uid() is never set and a policy
-- could not tell users apart. Only the server (secret key, bypasses RLS) reads
-- or writes: RLS on with no policies denies anon and authenticated, and the
-- revoke removes their table grants as a second lock
alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
