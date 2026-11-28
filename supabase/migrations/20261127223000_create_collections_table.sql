create type public.collection_mode as enum ('solo', 'team');

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  -- The student who created it (the connected wallet's user)
  creator_id uuid not null references public.users(id) on delete cascade,
  mode public.collection_mode not null,
  -- name and description are saved on-chain and in the JSON: they never change.
  -- The name limit is in bytes (UTF-8), like an NFT's name
  name text not null check (octet_length(name) between 1 and 32),
  description text not null check (char_length(description) between 1 and 400),
  field text not null,
  keywords text[] not null check (cardinality(keywords) between 1 and 5),
  -- The Metaplex Core collection account (base58)
  nft_address text not null unique,
  -- Public Pinata URL of the collection's JSON, the on-chain uri
  uri text not null,
  -- The signature of the transaction that minted the collection
  tx_signature text not null unique,
  -- Team only: the Squads multisig (PDA) that owns the collection
  multisig_pda text unique,
  created_at timestamptz not null default now(),
  constraint team_collection_has_multisig check (
    (mode = 'team') = (multisig_pda is not null)
  )
);

create index collections_creator_id_idx on public.collections (creator_id);

-- Same as users: only the server (secret key) reads or writes
alter table public.collections enable row level security;
revoke all on public.collections from anon, authenticated;
