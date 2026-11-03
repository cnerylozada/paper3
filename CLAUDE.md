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

Next.js App Router dapp (React 19, Tailwind v4, shadcn/ui) that connects a Phantom wallet on **Solana devnet** and reads balances. Next.js here is a newer version than most training data; check `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).

### The Kit client is the center of the app

`lib/solana.ts` builds one module-level client with `createClient().use(...)` from `@solana/kit` plugins, and exports `AppClient` (its type). Plugin order matters: `walletSigner` must come before `solanaDevnetRpc` because the RPC plugin requires a payer. The client exposes `client.rpc`, `client.system`, `client.token`, and `client.payer`/`client.identity` (the connected wallet's signer).

`components/solana-provider.tsx` (`"use client"`) publishes that client with `ClientProvider` from `@solana/react`; `app/layout.tsx` wraps everything in it and renders `Header`. Components read the client with `useClient<AppClient>()` and pass it to the wallet hooks from `@solana/kit-plugin-wallet/react` (`useConnectedWallet`, `useConnect`, `useWalletStatus`, ...). The client reference must stay stable (module scope).

### Fetching with `useRequest` (`@solana/react`)

`const { data, status, refresh } = useRequest(source)` works like TanStack Query: it fetches on mount, exposes `data` / `status` (`"fetching"`, `"error"`, ...) / `refresh()`, and **refetches whenever `source` changes identity**. A new `source` on every render means an endless refetch loop, so always memoize it.

**Which hook?** Count the calls:

- **One RPC call → `useMemo`.** Memoize the request object: `useMemo(() => client.rpc.getBalance(address), [client, address])` (`components/Balance.tsx`).
- **Several calls (chained or over a list) → `useCallback`.** Memoize an async function: `useCallback(() => Promise.all(...), [client, walletAddress])` (`fetchOwnerBalances` in `components/TokenBalance.tsx`).

Rules for both:
- The dependency array is the refetch trigger: list everything the request reads (`client`, the wallet address). Module-level constants like `MINTS` don't need to be listed.
- The function closes over the `useClient()` client, so don't pass `client` as a param.
- Gate on the wallet above the component that calls `useRequest`, so the address arrives non-null (see the wrapper/inner split below).

Installed `@solana/react` types differ from its README in places (e.g. `useTrackedData` field names); trust the `.d.ts` files.

### Token balances

`components/TokenBalance.tsx` derives each ATA with `findAssociatedTokenPda` from `@solana-program/token`, using `mintAccount.programAddress` (fetched via `client.token.accounts.mint.fetch`) as the token program. This works for both classic Token and Token-2022 mints without installing `@solana-program/token-2022`. The plugin returns raw base units, so amounts are formatted with `formatTokenAmount` using the mint's decimals. The mint list (`MINTS`) is hardcoded in the file.

`TokenBalance` is split into a wrapper (checks `useWalletStatus` / `useConnectedWallet`, renders nothing while `pending` auto-reconnect) and an inner `TokenBalanceList` that receives a guaranteed `walletAddress`. Keep wallet checks above any component that calls hooks needing an owner.

## Conventions and gotchas

- `@/*` maps to the project root (`@/components/...`, `@/lib/...`).
- `tsconfig` targets ES2017, so **bigint literals (`1n`) don't compile**; use `BigInt(...)`.
- shadcn style is `base-nova` (built on `@base-ui/react`, not Radix): polymorphic buttons use the `render` prop, not `asChild`. `cn` comes from `lib/utils.ts`, which re-exports it from the `cn` package (the shadcn default; keep it).
- App-specific helpers (`shortenAddress`, `formatSol`, `formatTokenAmount`, `PHANTOM_WALLET_NAME`) live in `components/utils.ts`, separate from shadcn's `lib/utils.ts`.
- Only Phantom is surfaced in the UI (`ConnectWalletButton` filters discovered wallets by name; `HeaderActions` shows the connect button or, when connected, the Dashboard link and wallet pill).
- Wallet icons are data URIs, hence the `eslint-disable @next/next/no-img-element` comments on `<img>`.
