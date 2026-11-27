export const PINATA_UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";
export const PINATA_GROUPS_URL = "https://api.pinata.cloud/v3/groups/public";

export const MAX_SVG_SIZE = 100 * 1024; // 100 KB, a generated SVG is a few KB
// On-chain limits of a Metaplex NFT: the name is stored in the account (32
// bytes, UTF-8, so accents and emoji take more than one) and the uri up to 200.
// The description lives in the off-chain JSON, so it has no on-chain limit: this
// cap only keeps wallets and marketplaces from truncating it
export const MAX_COLLECTION_NAME_LENGTH = 32;
export const MAX_DESCRIPTION_LENGTH = 400;
export const byteLength = (text: string) =>
  new TextEncoder().encode(text).length;
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 5;

// Every collection uses the same static cover for now. Replace it with the
// public Pinata URL of the cover image
export const COLLECTION_IMAGE_URL =
  "https://coral-giant-donkey-508.mypinata.cloud/ipfs/bafkreihr3ojmrzlnqkmvmj3ogtxllyiqymj7sqghnsnxxq6gcvkynb47se";

// The field of a collection and its keywords, how readers find it
export const FIELDS = [
  "Biology",
  "Chemistry",
  "Physics",
  "Medicine",
  "Engineering",
  "Computer science",
  "Economics",
  "Social sciences",
  "Other",
] as const;
export const MAX_KEYWORDS = 5;
export const MAX_KEYWORD_LENGTH = 24;
