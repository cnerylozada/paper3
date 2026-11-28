// On-chain limits of a Metaplex NFT: the name is stored in the account (32
// bytes, UTF-8, so accents and emoji take more than one) and the uri up to 200.
// The description lives in the off-chain JSON, so it has no on-chain limit: this
// cap only keeps wallets and marketplaces from truncating it
export const MAX_COLLECTION_NAME_LENGTH = 32;
export const MAX_DESCRIPTION_LENGTH = 400;

// The keywords readers find a collection by, and the size of a team
export const MAX_KEYWORDS = 5;
export const MAX_KEYWORD_LENGTH = 24;
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 5;
