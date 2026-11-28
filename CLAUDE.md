# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # dev server on http://localhost:3000
npm run build   # production build
npm run lint    # eslint
npx tsc --noEmit  # typecheck (no script for it)
```

There is no test runner configured.

## Architecture

Next.js App Router dapp (React 19, Tailwind v4, shadcn/ui) that (**Paper3**, for tokenizing intellectual property) runs on **Solana devnet**. Users log in with Google through Privy, which creates an embedded Solana wallet; balances are read, SOL is transferred, Metaplex Core NFTs are minted, Squads multisigs are created and read, and an Anchor program (`favorites`) is called. Routes: `/` (home), `/login`, `/dashboard`, `/dashboard/[userId]/collections/create`, `/favorites`. Next.js here is a newer version than most training data; check `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).

### The Kit client is the center of the app

`lib/solana.ts` builds one module-level client with `createClient().use(...)` from `@solana/kit` plugins, and exports `AppClient` (its type). Plugin order matters: `walletSigner` must come before `solanaDevnetRpc` because the RPC plugin requires a payer. The client exposes `client.rpc`, `client.system`, `client.token`, `client.favorites` (the Codama-generated program plugin, see below), and `client.payer`/`client.identity` (the connected wallet's signer, not used in practice).

`components/providers/SolanaKitProvider.tsx` (`"use client"`) publishes that client with `ClientProvider` from `@solana/react`; `app/layout.tsx` wraps everything in `PrivySVMProvider` > `SolanaKitProvider` and renders `MainHeader` (`components/mainHeader/`). Components read the client with `useClient<AppClient>()`. The client reference must stay stable (module scope).

### Privy owns the wallet

Login and the wallet come from Privy (`components/providers/PrivySVMProvider.tsx`): `loginMethods: ["google"]`, an embedded Solana wallet created on login. Read it with `usePrivy()` (`ready`, `authenticated`, `login`, `logout`) and `useWallets()` from `@privy-io/react-auth/solana` (`wallets[0].address`). `ready` means Privy finished restoring the session; `authenticated` is only meaningful once `ready` is true.

Kit's `walletSigner` is still in `lib/solana.ts` (the RPC plugin needs a payer on the client) but nothing connects through it, so **`client.payer` is not the user's wallet**. Build transactions with `createNoopSigner(address(wallet.address))` as the source and fee payer, then send with Privy's `useSignAndSendTransaction()` (`components/dashboard/TransferSOLForm.tsx`). The flow in every form is the same: build the transaction message with the wallet as fee payer, `compileTransaction`, encode with `getTransactionEncoder()` into a `Uint8Array`, `signAndSendTransaction({ transaction, wallet, chain: "solana:devnet" })`, and turn `result.signature` (a `Uint8Array`) into a string with `getBase58Decoder().decode(...)`. If the transaction also needs signatures from new keypairs (a collection, a multisig create key), sign only with those before sending; Privy adds the wallet signature (`NFT101`, `CreateSquad`).

Privy needs its own RPC for every chain it signs on: `solana.rpcs` in `PrivySVMProvider`, and pass `chain: "solana:devnet"` when signing, or it defaults to mainnet and fails ("No RPC configuration found" / "error preparing your transaction"). `@solana-program/memo` is in `package.json` only because Privy needs it: `@privy-io/react-auth/solana` imports it internally and declares it as a peer dependency, so npm doesn't install it. Without it Next fails with `Module not found: Can't resolve '@solana-program/memo'` on any page that loads Privy's Solana hooks. Our code never imports it; don't remove it.

### Fetching with `useRequest` (`@solana/react`)

`const { data, status, refresh } = useRequest(source)` works like TanStack Query: it fetches on mount, exposes `data` / `status` (`"fetching"`, `"error"`, ...) / `refresh()`, and **refetches whenever `source` changes identity**. A new `source` on every render means an endless refetch loop, so always memoize it.

**Which hook?** Count the calls:

- **One RPC call → `useMemo`.** Memoize the request object: `useMemo(() => client.rpc.getBalance(address), [client, address])` (`components/Balance.tsx`).
- **Several calls (chained or over a list) → `useCallback`.** Memoize an async function: `useCallback(() => Promise.all(...), [client, walletAddress])`; if it must be `null` while the wallet is disconnected, use `useMemo(() => walletAddress ? () => Promise.all(...) : null, [...])` (`useRequest(null)` is disabled) (`fetchOwnerBalances` in `components/dashboard/TokenBalances.tsx`).

Rules for both:
- The dependency array is the refetch trigger: list everything the request reads (`client`, the wallet address). Module-level constants like `MINTS` don't need to be listed.
- The function closes over the `useClient()` client, so don't pass `client` as a param.
- Get the Privy wallet with `useWalletAddress()` (`components/hooks.tsx`). Hooks can't run after an early return, so pass `null` to `useRequest` while `wallet` is null and `return noWalletFallback` after the hooks.

Installed `@solana/react` types differ from its README in places (e.g. `useTrackedData` field names); trust the `.d.ts` files.

### Token balances

`components/dashboard/TokenBalances.tsx` derives each ATA with `findAssociatedTokenPda` from `@solana-program/token`, using `mintAccount.programAddress` (fetched via `client.token.accounts.mint.fetch`) as the token program. This works for both classic Token and Token-2022 mints without installing `@solana-program/token-2022`. The plugin returns raw base units, so amounts are formatted with `formatTokenAmount` using the mint's decimals. The mint list (`MINTS`) is hardcoded in the file.

`TokenBalances` is a single component rendered on the dashboard. An ATA address can always be derived but its account may not exist, so it reads token accounts with `fetchMaybe` and shows `0` when `exists` is false (`fetch` would throw and break the whole `Promise.all`). `client.token` does not expose Token-2022 metadata (`name`, `symbol`, `uri`); read it with `client.rpc.getAccountInfo(mint, { encoding: "jsonParsed" })` (the `tokenMetadata` extension) or `@solana-program/token-2022`.

`useWalletAddress()` is built on Privy (`usePrivy` + `useWallets`) and returns `{ wallet, noWalletFallback }`: `wallet` is the Privy wallet (use `wallet.address`; it is a plain `string`, wrap with `address(...)` for Kit) and is null until Privy is `ready`, authenticated and has a wallet. `noWalletFallback` is a "Connect your wallet" hint. Components that need a connected wallet do `if (!wallet) return noWalletFallback;` (after their hooks). Used by every component that needs the wallet (`TransferSOLForm`, `WelcomeUser`, `NFT101`, `CreateSquad`, `Read`/`Write` in `components/favorites/`).

### Metaplex Core and Squads

- **Metaplex Core** (`components/dashboard/NFT101.tsx`) uses Umi: `createUmi(rpc).use(mplCore())`, with the wallet as a no-op identity (`signerIdentity(createNoopSigner(publicKey(wallet.address)))`) and `generateSigner` for the new collection/asset accounts. `.add()` chains builders into one transaction; `buildAndSign(umi)` signs only with the new keypairs, then `umi.transactions.serialize(...)` goes to Privy. Metadata JSON (image, attributes) is uploaded to Pinata and its URL is the `uri`; the on-chain `name` must match the JSON's `name`.
- **Umi and Kit are different libraries with incompatible types**: Umi calls need Umi's `publicKey`/`createNoopSigner`, Kit calls need Kit's `address`/`createNoopSigner`. Mixing them gives TS2345. `@metaplex-foundation/umi` is imported but only a transitive dependency.
- **Squads** uses `@sqds/multisig-kit` (the Kit version of `@sqds/multisig`, no web3.js). It is a 0.x release: keep the version pinned. PDAs and instruction builders are async; signer fields accept an `Address` (becomes a no-op signer for Privy) or a real signer. `CreateSquad` creates a multisig with `multisigCreateV2` and signs the random `createKey` locally with `partiallySignTransaction([createKeySigner.keyPair], tx)`. The multisig PDA is the squad's id (not the create key); the vault (`getVaultPda`, index 0) holds funds and signs only inside vault transactions. `LeadMember` has console-logging buttons that read a multisig with `multisig.accounts.fetchMultisig`.
- **Squads proposal flow** (`CreateProposal`, `VoteProposals`, `ExecuteProposals`, `TransactionSigners` in `components/dashboard/`, not yet rendered on the dashboard page): they share a hardcoded `MULTISIG_PDA`. Proposals have no on-chain list: read `squad.transactionIndex`, derive each `getProposalPda`, and load them with `fetchAllMaybeProposal`. `proposal.approved` lists the members who approved (the proof of who signed); `TransactionSigners` finds the Squads instruction in an execution transaction (`vaultTransactionExecute` accounts: `[multisig, proposal, transaction, member]`) and compares the squad's members with who approved or executed.
- **Off-chain metadata templates** live in `docs/metadata/{solo,team}/{collection,asset}.json` (placeholders in `<...>`). Everything in them is public; the private PDF's Pinata CID must never appear there. The asset `image` is an SVG generated from the PDF's SHA-256 hash and uploaded to public Pinata. `share` and `License` are intentionally left out.

### Supabase and server actions

- `lib/supabase.ts` is a **server-only** client (`@supabase/supabase-js`, typed with `lib/database.types.ts`). It uses `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (no `NEXT_PUBLIC_` vars; the secret key bypasses RLS, so never import it from a `"use client"` file). Login is Privy, not Supabase Auth, so tables have RLS on with no policies and `revoke all from anon, authenticated`: only server actions touch the DB.
- Server actions live in `server/` (`"use server"` files, e.g. `server/users.ts`). Check `{ error }` from every query and map Postgres codes (`23505` unique violation) to friendly messages. DB column types live in `server/models/*` (e.g. `CollectionField = Enums<"collection_field">`); reuse them and `Constants.public.Enums` from the generated types instead of redefining.
- Schema is in `supabase/migrations/`: `users`, `collections`, `collection_members` (many to many, `is_creator` flag; list a user's collections and role by querying from `collection_members`, because embedding `collections` from `users` is ambiguous with `collections.creator_id`), and the `collection_field` / `collection_mode` enums. Push with `npx supabase db push --remote` (the CLI defaults to the local Docker stack). A pushed migration is never re-run if edited: add a new one. Regenerate types with `npx supabase gen types typescript --project-id vlzlcfsmxeutzxmaeyez --schema public > lib/database.types.ts`.
- `saveUser` runs inside `useLogin({ onComplete })` in `ConnectWalletButton`, then `getUserIdByWallet` and `router.replace(`/dashboard/${userId}`)`. The `[userId]` in the dashboard urls is the `users.id` (uuid), not the wallet; `useUserId()` (`components/hooks.tsx`) reads it on the client. Do the save and redirect there, not in an effect on `authenticated`: the Google OAuth redirect unmounts the button first.
- **Known gap:** server actions trust client input (no Privy token verification, no membership check yet).

### Collections (create flow)

Route `/dashboard/[userId]/collections/create` renders `CreateCollectionForm` (`components/collections/create/`): a `RadioCardGroup` for solo/team mode, then `SoloCollectionForm` or `TeamCollectionForm`, plus `CollectionSummary`. Zod schemas are only in `components/collections/create/schemas.ts`; constants (limits, field list) are in `models.ts` next to it. Limits follow the NFT: name at most 32 bytes (UTF-8, `byteLength`), uri at most 200 chars; description (max 400) is off-chain only. Each collection has a `field` (enum) and 1-5 `keywords`, saved as Field/Keywords attributes in the Pinata JSON (`server/pinata/utils.ts`, `topicAttributes`). Pinata uploads are server actions in `server/pinata/`; never print `PINATA_JWT`. `saveCollection` (`server/collections.ts`) stores the collection and its members after minting (the solo form calls it; the team form does not mint yet). `getCollectionListByMember(userId)` lists the collections a user created or co-authors, and `components/collections/list/MyCollectionList` renders them as `CollectionCard`s on the dashboard. The app uses `cacheComponents`: awaiting `params` outside `Suspense` gives a "Blocking Route" error.

### Common components

`components/commons/` holds our own form building blocks; use them directly, without wrappers: `AppButton` (`loading`), `AppTextInput`, `AppTextArea` (both with an `aside` slot for `CantChangeBadge` / `LengthCounter`), `AppChipGroup`, `AppKeywordsInput`, `RadioCardGroup`, `StatusAlert` (`variant` success or warning), `BackLink`, `FormField`. Page headers belong in the page, not in the form component. Run prettier only on specific files, never on `components/ui` (shadcn).

### Adding an Anchor program with Codama

Each program lives in `lib/programs/<name>/` (`idl.json`, `codama.json`, and the `generated/` output, which is never edited by hand). Run from the project root, in this order:

1. Put the Anchor IDL at `lib/programs/<name>/idl.json`.
2. Create the config. The argument is where the **config** is written (never the IDL path). Answer the IDL prompt with the IDL's path and pick only the JavaScript preset:
   ```sh
   npx codama init lib/programs/<name>/codama.json
   ```
3. **Edit the generated `codama.json` before running anything.** `init` only writes the IDL path from the prompt and `"args": ["<package folder>"]`, so `run` would create `src/generated` and a `package.json`. Change it to:
   ```json
   {
     "idl": "idl.json",
     "before": [],
     "scripts": {
       "js": {
         "from": "@codama/renderers-js",
         "args": [".", { "generatedFolder": "lib/programs/<name>/generated", "syncPackageJson": false }]
       }
     }
   }
   ```
   `idl` is resolved relative to the config file's folder (`init` writes it relative to the project root, so running without this edit fails with "Cannot access IDL"); `args` and `generatedFolder` are relative to the project root.
4. Generate the client. Always pass `--config` (the CLI only looks for a root `codama.json` by default), and re-run it whenever the IDL changes:
   ```sh
   npx codama run js --config lib/programs/<name>/codama.json
   ```
5. Register the plugin in `lib/solana.ts` (`.use(<name>Program())`, after the other plugins). Call it as `client.<name>.instructions.<instruction>(...)` (see `components/favorites/Write.tsx`). The IDL's `address` is baked into the generated code, so the program must be deployed there on devnet.

## Conventions and gotchas

- `@/*` maps to the project root (`@/components/...`, `@/lib/...`).
- `tsconfig` targets ES2017, so **bigint literals (`1n`) don't compile**; use `BigInt(...)`.
- shadcn style is `base-nova` (built on `@base-ui/react`, not Radix): polymorphic buttons use the `render` prop, not `asChild`. `cn` comes from `lib/utils.ts`, which re-exports it from the `cn` package (the shadcn default; keep it).
- App-specific helpers (`shortenAddress`, `formatSol`, `formatTokenAmount`) live in `components/utils.ts`, separate from shadcn's `lib/utils.ts`.
- `HeaderActions` shows a Login link to `/login` (which renders `ConnectWalletButton`, the Privy login modal) or, when logged in, the Dashboard link and wallet pill with a logout button.
- Transaction forms (`TransferSOLForm`, `NFT101`, `CreateSquad`, `Write`) use plain `useState` + `try/catch` (`signature`, `error`, `isSending`); `TransactionSuccess` shows the explorer link. Forms with inputs use `react-hook-form` + `zod`.
- Wallet icons are data URIs, hence the `eslint-disable @next/next/no-img-element` comments on `<img>`.
