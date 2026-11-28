-- Same values, spelled the same, as the document type and language lists in
-- the app. A new value needs `alter type ... add value` in a new migration
create type public.asset_document_type as enum (
  'Article',
  'Thesis or dissertation',
  'Literature review',
  'Research proposal',
  'Report',
  'Other'
);

create type public.asset_language as enum (
  'English',
  'Spanish',
  'Portuguese',
  'Other'
);

-- A collection has one or more assets: each asset is a version (v1.0, v1.1, v2.0, ...) of
-- the research line. Only the creator of the collection publishes them
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  -- Like v1.0 or v9.3 (unique inside its collection)
  version text not null check (version ~ '^v[0-9]+\.[0-9]+$'),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 600),
  document_type public.asset_document_type not null,
  language public.asset_language not null,
  -- What changed from the previous version (v1 has nothing to compare with)
  whats_new text check (char_length(whats_new) between 1 and 500),
  -- The private PDF in Pinata (its CID or url). Never public
  file_uri text not null,
  -- The Metaplex Core asset account (base58)
  nft_address text not null unique,
  -- Public Pinata URL of the NFT's JSON, the on-chain uri (not the PDF's)
  metadata_uri text not null,
  -- The signature of the transaction that minted the asset
  mint_tx_signature text not null unique,
  -- Team only: the signature of the Squads proposal transaction
  proposal_tx_signature text unique,
  created_at timestamptz not null default now(),
  unique (collection_id, version)
);

-- Same as users: only the server (secret key) reads or writes
alter table public.assets enable row level security;
revoke all on public.assets from anon, authenticated;
