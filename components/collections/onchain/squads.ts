import {
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase58Decoder,
  getTransactionEncoder,
  partiallySignTransaction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import * as multisig from "@sqds/multisig-kit";
import type { AppClient } from "@/lib/solana";
import type { SignAndSendTransaction, Wallet } from "./metaplex";

// Creates a Squads multisig on devnet with the team's wallets as its members.
// `members[0]` must be the connected wallet: it creates the squad and pays
export const createSquad = async ({
  client,
  wallet,
  signAndSendTransaction,
  members,
}: {
  client: AppClient; // from useClient<AppClient>()
  wallet: Wallet; // the Privy wallet, from useWalletAddress()
  signAndSendTransaction: SignAndSendTransaction; // from useSignAndSendTransaction()
  members: string[]; // wallet addresses, the creator first
}) => {
  const creator = address(wallet.address);

  // Random keypair whose address derives the multisig PDA.
  // It is a signer of the transaction, so it must be a real signer
  const createKeySigner = await generateKeyPairSigner();
  const [multisigPda] = await multisig.getMultisigPda({
    createKey: createKeySigner.address,
  });

  // The vault (index 0) is the squad's account that holds funds and assets
  const [vaultPda] = await multisig.getVaultPda({ multisigPda, index: 0 });

  // The Squads program charges a creation fee that goes to its treasury
  const [programConfigPda] = await multisig.getProgramConfigPda({});
  const { data: programConfig } = await multisig.accounts.fetchProgramConfig(
    client.rpc,
    programConfigPda,
  );

  const createSquadIx = await multisig.instructions.multisigCreateV2({
    treasury: programConfig.treasury,
    creator, // an address: Privy signs it when sending
    multisigPda,
    configAuthority: null, // no admin: changes need a vote
    threshold: members.length, // every member must vote to approve
    members: members.map((member, index) => ({
      key: address(member),
      // The creator can do everything, the others can only vote
      permissions:
        index === 0
          ? multisig.Permissions.all()
          : multisig.Permissions.fromPermissions([multisig.Permission.Vote]),
    })),
    timeLock: 0,
    createKey: createKeySigner, // a signer: signed here, below
    rentCollector: null,
  });

  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send();

  const compiledTx = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(creator, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstruction(createSquadIx, tx),
    (tx) => compileTransaction(tx),
  );

  // Sign with the createKey keypair only; Privy adds the wallet signature
  const signedTx = await partiallySignTransaction(
    [createKeySigner.keyPair],
    compiledTx,
  );

  const result = await signAndSendTransaction({
    transaction: new Uint8Array(getTransactionEncoder().encode(signedTx)),
    wallet,
    chain: "solana:devnet",
  });

  return {
    signature: getBase58Decoder().decode(result.signature),
    multisigPda,
    vaultPda,
  };
};
