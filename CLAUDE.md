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

Next.js App Router dapp (React 19, Tailwind v4, shadcn/ui) that (**Paper3**, for tokenizing intellectual property) runs on **Solana devnet**. Users log in with Google through Privy, which creates an embedded Solana wallet; balances are read and SOL is transferred. Next.js here is a newer version than most training data; check `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).

### The Kit client is the center of the app

`lib/solana.ts` builds one module-level client with `createClient().use(...)` from `@solana/kit` plugins, and exports `AppClient` (its type). Plugin order matters: `walletSigner` must come before `solanaDevnetRpc` because the RPC plugin requires a payer. The client exposes `client.rpc`, `client.system`, `client.token`, and `client.payer`/`client.identity` (the connected wallet's signer).

`components/providers/SolanaKitProvider.tsx` (`"use client"`) publishes that client with `ClientProvider` from `@solana/react`; `app/layout.tsx` wraps everything in `PrivySVMProvider` > `SolanaKitProvider` and renders `MainHeader` (`components/mainHeader/`). Components read the client with `useClient<AppClient>()`. The client reference must stay stable (module scope).

### Privy owns the wallet

Login and the wallet come from Privy (`components/providers/PrivySVMProvider.tsx`): `loginMethods: ["google"]`, an embedded Solana wallet created on login. Read it with `usePrivy()` (`ready`, `authenticated`, `login`, `logout`) and `useWallets()` from `@privy-io/react-auth/solana` (`wallets[0].address`). `ready` means Privy finished restoring the session; `authenticated` is only meaningful once `ready` is true.

Kit's `walletSigner` is still in `lib/solana.ts` (the RPC plugin needs a payer on the client) but nothing connects through it, so **`client.payer` is not the user's wallet**. Build transactions with `createNoopSigner(address(wallet.address))` as the source and fee payer, then send with Privy's `useSignAndSendTransaction()` (`components/dashboard/TransferSOLForm.tsx`).

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

`TokenBalances` is a single component. It is currently commented out and not rendered on the dashboard (it still references the old `walletAddress` shape); re-enable it with `wallet?.address` as the owner.

`useWalletAddress()` is built on Privy (`usePrivy` + `useWallets`) and returns `{ wallet, noWalletFallback }`: `wallet` is the Privy wallet (use `wallet.address`; it is a plain `string`, wrap with `address(...)` for Kit) and is null until Privy is `ready`, authenticated and has a wallet. `noWalletFallback` is a "Connect your wallet" hint. Components that need a connected wallet do `if (!wallet) return noWalletFallback;` (after their hooks). Used by `TransferSOLForm` and `WelcomeUser`.

## Conventions and gotchas

- `@/*` maps to the project root (`@/components/...`, `@/lib/...`).
- `tsconfig` targets ES2017, so **bigint literals (`1n`) don't compile**; use `BigInt(...)`.
- shadcn style is `base-nova` (built on `@base-ui/react`, not Radix): polymorphic buttons use the `render` prop, not `asChild`. `cn` comes from `lib/utils.ts`, which re-exports it from the `cn` package (the shadcn default; keep it).
- App-specific helpers (`shortenAddress`, `formatSol`, `formatTokenAmount`, `PHANTOM_WALLET_NAME`) live in `components/utils.ts`, separate from shadcn's `lib/utils.ts`.
- `HeaderActions` shows `ConnectWalletButton` (opens the Privy login modal) or, when logged in, the Dashboard link and wallet pill with a logout button.
- Transfer status (`TransferSOLForm`) uses plain `useState` + `try/catch` (`signature`, `error`, `isSending`); `TransactionSuccess` shows the explorer link.
- Wallet icons are data URIs, hence the `eslint-disable @next/next/no-img-element` comments on `<img>`.
