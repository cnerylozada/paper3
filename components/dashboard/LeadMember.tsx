"use client";

import { useClient } from "@solana/react";
import { address } from "@solana/kit";
import * as multisig from "@sqds/multisig-kit";
import { Button } from "@/components/ui/button";
import { AppClient } from "@/lib/solana";
import { formatSol } from "../utils";

const MULTISIG_PDA = address("5CbNUCvtTUZEPkuUGHHio5dGuBQ7D5zSvoZ2NR9JVSr5");

const BALANCE_ADDRESS = address("3s5DFYnBb7Ujvt9uceWGS2QN5YYLWGbV3Td2LAzuXMfW");

// How many vault indexes to check (a multisig can have up to 256)
const VAULTS_TO_CHECK = 3;

const getPermissionFlags = (permissions: { mask: number }) => ({
  canInitiate: multisig.Permissions.has(
    permissions,
    multisig.Permission.Initiate,
  ),
  canVote: multisig.Permissions.has(permissions, multisig.Permission.Vote),
  canExecute: multisig.Permissions.has(
    permissions,
    multisig.Permission.Execute,
  ),
});

export const LeadMember = () => {
  const client = useClient<AppClient>();

  const onLogMultisig = async () => {
    const { data, programAddress } = await multisig.accounts.fetchMultisig(
      client.rpc,
      MULTISIG_PDA,
    );
    console.log("Multisig data", data, programAddress);
  };

  const onLogBalance = async () => {
    const { value: account } = await client.rpc
      .getAccountInfo(BALANCE_ADDRESS)
      .send();
    console.log("account", account);
    // value is null when the account doesn't exist (no SOL yet)
    const lamports = account?.lamports ?? BigInt(0);
    console.log("Balance", `${formatSol(lamports)} SOL`, lamports);
  };

  const onLogMembers = async () => {
    const { data } = await multisig.accounts.fetchMultisig(
      client.rpc,
      MULTISIG_PDA,
    );
    console.log(
      "Members",
      data.members.map((member) => ({
        key: member.key,
        ...getPermissionFlags(member.permissions),
      })),
    );
  };

  const onLogMemberInfo = async () => {
    const { data } = await multisig.accounts.fetchMultisig(
      client.rpc,
      MULTISIG_PDA,
    );
    const member = data.members.find((m) => m.key === BALANCE_ADDRESS);
    if (!member) {
      console.log("Not a member of this multisig", BALANCE_ADDRESS);
      return;
    }

    // The member is a wallet: its account data comes from the RPC
    const { value: account } = await client.rpc
      .getAccountInfo(BALANCE_ADDRESS)
      .send();
    console.log("Member", {
      key: member.key,
      permissions: getPermissionFlags(member.permissions),
      account,
    });
  };

  const onLogProposals = async () => {
    const { data } = await multisig.accounts.fetchMultisig(
      client.rpc,
      MULTISIG_PDA,
    );

    // Proposals have no list on-chain: transaction indexes go from 1 to
    // transactionIndex, and each one has a proposal PDA
    const transactionIndexes = Array.from(
      { length: Number(data.transactionIndex) },
      (_, i) => BigInt(i + 1),
    );
    const proposalPdas = await Promise.all(
      transactionIndexes.map(async (transactionIndex) => {
        const [proposalPda] = await multisig.getProposalPda({
          multisigPda: MULTISIG_PDA,
          transactionIndex,
        });
        return proposalPda;
      }),
    );
    const proposals = await multisig.accounts.fetchAllMaybeProposal(
      client.rpc,
      proposalPdas,
    );
    console.log("Proposals", proposals);
  };

  const onLogVaults = async () => {
    // A multisig can have up to 256 vaults (index 0-255), derived from the
    // multisig address. They are not stored on-chain, so check the first ones
    const vaultIndexes = Array.from({ length: VAULTS_TO_CHECK }, (_, i) => i);
    const vaultPdas = await Promise.all(
      vaultIndexes.map(async (index) => {
        const [vaultPda] = await multisig.getVaultPda({
          multisigPda: MULTISIG_PDA,
          index,
        });
        return vaultPda;
      }),
    );
    const { value: accounts } = await client.rpc
      .getMultipleAccounts(vaultPdas, { encoding: "base64" })
      .send();
    console.log(
      "Vaults",
      vaultPdas.map((vaultPda, index) => ({
        index,
        address: vaultPda,
        // null account: the vault has never received SOL
        balance: `${formatSol(accounts[index]?.lamports ?? BigInt(0))} SOL`,
      })),
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onLogMultisig}>Log multisig data</Button>
      <Button onClick={onLogMembers}>Log squad members</Button>
      <Button onClick={onLogMemberInfo}>Log member info</Button>
      <Button onClick={onLogProposals}>Log proposals</Button>
      <Button onClick={onLogVaults}>Log vaults</Button>
      <Button onClick={onLogBalance}>Log address balance</Button>
    </div>
  );
};
