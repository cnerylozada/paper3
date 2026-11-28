export const PINATA_UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";
export const PINATA_GROUPS_URL = "https://api.pinata.cloud/v3/groups/public";

export const MAX_SVG_SIZE = 100 * 1024; // 100 KB, a generated SVG is a few KB
// UTF-8 bytes, how an NFT's on-chain name is measured: accents and emoji take
// more than one
export const byteLength = (text: string) =>
  new TextEncoder().encode(text).length;

// Every collection uses the same static cover for now. Replace it with the
// public Pinata URL of the cover image
export const COLLECTION_IMAGE_URL =
  "https://coral-giant-donkey-508.mypinata.cloud/ipfs/bafkreihr3ojmrzlnqkmvmj3ogtxllyiqymj7sqghnsnxxq6gcvkynb47se";
