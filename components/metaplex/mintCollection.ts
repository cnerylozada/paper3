import { createCollection, mplCore } from "@metaplex-foundation/mpl-core";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import type { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { getBase58Decoder } from "@solana/kit";

type Wallet = Parameters<
  ReturnType<typeof useSignAndSendTransaction>["signAndSendTransaction"]
>[0]["wallet"];
type SignAndSendTransaction = ReturnType<
  typeof useSignAndSendTransaction
>["signAndSendTransaction"];

// Mints a Metaplex Core collection owned by the wallet.
// `name` must match the `name` of the metadata JSON that `uri` points to
export const mintCollection = async ({
  wallet,
  signAndSendTransaction,
  name,
  uri,
}: {
  wallet: Wallet; // the Privy wallet, from useWalletAddress()
  signAndSendTransaction: SignAndSendTransaction; // from useSignAndSendTransaction()
  name: string;
  uri: string;
}) => {
  // The wallet is the identity (fee payer and collection authority) as a
  // no-op signer: it adds no signature here, Privy signs it when sending
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplCore())
    .use(signerIdentity(createNoopSigner(publicKey(wallet.address))));

  // The collection is a new account, so it needs its own keypair
  const collectionSigner = generateSigner(umi);

  const collectionTx = await createCollection(umi, {
    collection: collectionSigner,
    name,
    uri,
  }).buildAndSign(umi); // signs with the collection keypair only

  // Privy adds the wallet signature and sends the transaction
  const collectionTxResult = await signAndSendTransaction({
    transaction: umi.transactions.serialize(collectionTx),
    wallet,
    chain: "solana:devnet",
  });

  return {
    signature: getBase58Decoder().decode(collectionTxResult.signature),
    collection: collectionSigner.publicKey.toString(),
  };
};
