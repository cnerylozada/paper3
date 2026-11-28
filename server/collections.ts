"use server";

import { isAddress } from "@solana/kit";
import {
  MAX_COLLECTION_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/components/collections/create/models";
import { supabase } from "@/lib/supabase";
import { byteLength } from "./constants";
import type { CollectionField, CollectionMode } from "./models/collections";
import { isValidTopic } from "./pinata/utils";

// Stores a collection after it was minted, solo or team. `members` are the
// wallets of everyone in it, the creator included (a solo collection has just
// the creator). Every member must have logged in before, so they have a user
export const saveCollection = async ({
  mode,
  creatorWallet,
  members,
  name,
  description,
  field,
  keywords,
  nftAddress,
  uri,
  txSignature,
  multisigPda,
}: {
  mode: CollectionMode;
  creatorWallet: string;
  members: string[];
  name: string;
  description: string;
  field: CollectionField;
  keywords: string[];
  nftAddress: string;
  uri: string;
  txSignature: string;
  multisigPda?: string; // team only
}) => {
  name = name.trim();
  description = description.trim();
  keywords = keywords.map((keyword) => keyword.trim());
  if (
    !name ||
    byteLength(name) > MAX_COLLECTION_NAME_LENGTH ||
    !description ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    !isValidTopic(field, keywords)
  ) {
    throw new Error("Invalid collection");
  }
  if (!uri.trim() || !txSignature.trim()) {
    throw new Error("Invalid collection");
  }
  if (
    !isAddress(creatorWallet) ||
    !isAddress(nftAddress) ||
    members.some((member) => !isAddress(member))
  ) {
    throw new Error("Invalid wallet");
  }
  if (new Set(members).size !== members.length) {
    throw new Error("A wallet is listed twice");
  }
  if (!members.includes(creatorWallet)) {
    throw new Error("The creator must be a member");
  }
  if (mode === "solo" && members.length !== 1) {
    throw new Error("A solo collection has only its creator");
  }
  if (mode === "team") {
    if (!multisigPda || !isAddress(multisigPda)) {
      throw new Error("Invalid squad");
    }
  } else if (multisigPda) {
    throw new Error("A solo collection has no squad");
  }

  // The users behind the wallets
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, wallet_address")
    .in("wallet_address", members);
  if (usersError) {
    throw new Error("Could not save the collection");
  }
  if (users.length !== members.length) {
    throw new Error("Every member must have logged in to Paper3 first");
  }
  const creator = users.find((user) => user.wallet_address === creatorWallet)!;

  const { data: collection, error } = await supabase
    .from("collections")
    .insert({
      creator_id: creator.id,
      mode,
      name,
      description,
      field,
      keywords,
      nft_address: nftAddress,
      uri,
      tx_signature: txSignature,
      multisig_pda: mode === "team" ? multisigPda : null,
    })
    .select("id")
    .single();
  if (error) {
    // 23505: this collection (or its transaction) is already stored
    if (error.code === "23505") {
      throw new Error("This collection is already saved");
    }
    throw new Error("Could not save the collection");
  }

  const { error: membersError } = await supabase
    .from("collection_members")
    .insert(
      users.map((user) => ({
        collection_id: collection.id,
        user_id: user.id,
        is_creator: user.id === creator.id,
      })),
    );
  if (membersError) {
    // No transaction across two inserts: undo the collection so it is never
    // left without members
    await supabase.from("collections").delete().eq("id", collection.id);
    throw new Error("Could not save the collection");
  }

  return { id: collection.id };
};

// Every collection a user belongs to, as creator or as a member, newest first.
// It starts from collection_members: embedding collections from users is
// ambiguous because collections.creator_id also links them
export const getCollectionListByMember = async (userId: string) => {
  if (!userId.trim()) {
    throw new Error("Invalid user");
  }

  const { data, error } = await supabase
    .from("collection_members")
    .select(
      "is_creator, collections(id, mode, name, field, created_at, members:collection_members(count))",
    )
    .eq("user_id", userId);
  if (error) {
    throw new Error("Could not get the collections");
  }

  return data
    .flatMap(({ is_creator, collections }) => {
      if (!collections) return [];
      const { members, ...collection } = collections;
      return [
        {
          ...collection,
          memberCount: members[0]?.count ?? 1,
          isCreator: is_creator,
        },
      ];
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export type CollectionCardItem = Awaited<
  ReturnType<typeof getCollectionListByMember>
>[number];
