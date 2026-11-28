"use server";

import { isAddress } from "@solana/kit";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_WHATS_NEW_LENGTH,
} from "@/components/assets/models";
import { getNextVersion } from "@/components/assets/version";
import { Constants } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import type { AssetDocumentType, AssetLanguage } from "./models/assets";

// Every asset (version) of a collection. Empty while nothing was published
export const getAssetListByCollection = async (collectionId: string) => {
  const { data, error } = await supabase
    .from("assets")
    .select("version")
    .eq("collection_id", collectionId);
  if (error) throw new Error("Could not get the assets");
  return data;
};

// Stores a version of a solo collection after it was minted. Only the creator
// of the collection can add one
export const saveSoloAsset = async ({
  collectionId,
  creatorWallet,
  version,
  title,
  description,
  documentType,
  language,
  whatsNew,
  fileUri,
  metadataUri,
  nftAddress,
  mintTxSignature,
}: {
  collectionId: string;
  creatorWallet: string;
  version: string;
  title: string;
  description: string;
  documentType: AssetDocumentType;
  language: AssetLanguage;
  whatsNew: string;
  fileUri: string; // the PDF in Pinata
  metadataUri: string; // the NFT's JSON, the on-chain uri
  nftAddress: string;
  mintTxSignature: string;
}) => {
  title = title.trim();
  description = description.trim();
  whatsNew = whatsNew.trim();
  if (
    !title ||
    title.length > MAX_TITLE_LENGTH ||
    !description ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    whatsNew.length > MAX_WHATS_NEW_LENGTH ||
    !Constants.public.Enums.asset_document_type.includes(documentType) ||
    !Constants.public.Enums.asset_language.includes(language) ||
    !fileUri.trim() ||
    !metadataUri.trim() ||
    !mintTxSignature.trim()
  ) {
    throw new Error("Invalid version");
  }
  if (!isAddress(creatorWallet) || !isAddress(nftAddress)) {
    throw new Error("Invalid wallet");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", creatorWallet)
    .maybeSingle();
  if (userError || !user) throw new Error("Could not save the version");

  // The user must be the creator of this collection, and it must be solo
  const { data: member, error: memberError } = await supabase
    .from("collection_members")
    .select("collections(mode)")
    .eq("collection_id", collectionId)
    .eq("user_id", user.id)
    .eq("is_creator", true)
    .maybeSingle();
  if (memberError) throw new Error("Could not save the version");
  if (member?.collections?.mode !== "solo") {
    throw new Error("Only the creator of a solo collection can add versions");
  }

  // The version must be the next major or minor of what is already published
  const next = getNextVersion(
    (await getAssetListByCollection(collectionId)).map((a) => a.version),
  );
  if (version !== next.major && version !== next.minor) {
    throw new Error(`The next version is ${next.major}`);
  }

  const { error } = await supabase.from("assets").insert({
    collection_id: collectionId,
    version,
    title,
    description,
    document_type: documentType,
    language,
    whats_new: whatsNew || null,
    file_uri: fileUri,
    metadata_uri: metadataUri,
    nft_address: nftAddress,
    mint_tx_signature: mintTxSignature,
  });
  if (error) {
    // 23505: this version (or its mint) is already stored
    if (error.code === "23505") throw new Error("This version already exists");
    throw new Error("Could not save the version");
  }
};
