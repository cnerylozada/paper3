-- Same values, spelled the same, as FIELDS in server/constants.ts. A new field
-- needs `alter type ... add value` in a new migration and an entry there
create type public.collection_field as enum (
  'Biology',
  'Chemistry',
  'Physics',
  'Medicine',
  'Engineering',
  'Computer science',
  'Economics',
  'Social sciences',
  'Other'
);

-- Fails if a row holds a value outside the list
alter table public.collections
  alter column field type public.collection_field
  using field::public.collection_field;
