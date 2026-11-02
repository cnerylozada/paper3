export { cn } from "cn"


export const PHANTOM_WALLET_NAME = "Phantom";

export const shortenAddress = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;
