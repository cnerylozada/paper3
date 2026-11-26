export const PHANTOM_WALLET_NAME = "Phantom";

export const shortenAddress = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

const LAMPORTS_PER_SOL = BigInt(1_000_000_000);

// Lamports (bigint) -> SOL string with up to 4 decimals, e.g. 1500000000n -> "1.5"
export const formatSol = (lamports: bigint) => {
  const whole = lamports / LAMPORTS_PER_SOL;
  const fraction =
    ((lamports % LAMPORTS_PER_SOL) * BigInt(10_000)) / LAMPORTS_PER_SOL;
  const decimals = fraction.toString().padStart(4, "0").replace(/0+$/, "");
  return decimals ? `${whole}.${decimals}` : `${whole}`;
};

// Base units -> human readable amount, e.g. (20000000000n, 9) -> "20"
export const formatTokenAmount = (amount: bigint, decimals: number) => {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(decimals, "0");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : `${whole}`;
};

export const explorerTxUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
