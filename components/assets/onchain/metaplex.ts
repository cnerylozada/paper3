import {
  create,
  fetchCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { getBase58Decoder } from "@solana/kit";
import type {
  SignAndSendTransaction,
  Wallet,
} from "@/components/collections/create/onchain/metaplex";

// Mints a Metaplex Core asset inside a collection. The wallet must be the
// collection's update authority (the one that created it).
// `name` must match the `name` of the metadata JSON that `uri` points to
export const mintAsset = async ({
  wallet,
  signAndSendTransaction,
  collection,
  name,
  uri,
}: {
  wallet: Wallet; // the Privy wallet, from useWalletAddress()
  signAndSendTransaction: SignAndSendTransaction; // from useSignAndSendTransaction()
  collection: string; // address of the collection
  name: string;
  uri: string;
}) => {
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplCore())
    .use(signerIdentity(createNoopSigner(publicKey(wallet.address))));

  // The asset is a new account, so it needs its own keypair
  const assetSigner = generateSigner(umi);

  const assetTx = await create(umi, {
    asset: assetSigner,
    collection: await fetchCollection(umi, publicKey(collection)),
    name,
    uri,
  }).buildAndSign(umi); // signs with the asset keypair only

  // Privy adds the wallet signature and sends the transaction
  const result = await signAndSendTransaction({
    transaction: umi.transactions.serialize(assetTx),
    wallet,
    chain: "solana:devnet",
  });

  return {
    signature: getBase58Decoder().decode(result.signature),
    asset: assetSigner.publicKey.toString(),
  };
};
