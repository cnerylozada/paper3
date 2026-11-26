"use server";

import { isAddress } from "@solana/kit";
import { COLLECTION_IMAGE_URL } from "@/components/metaplex/constants";
import { MAX_COLLECTION_NAME_LENGTH } from "../constants";
import { getOrCreateGroup, slugify, uploadPublicFile } from "./utils";

// Builds the solo collection JSON (docs/metadata/solo/collection.json) and
// uploads it to Pinata's public network. The returned URL is the collection's
// on-chain `uri`
export const uploadSoloCollection = async ({
  name,
  description,
  owner,
}: {
  name: string;
  description: string;
  owner: string; // the student's wallet, its only creator
}) => {
  name = name.trim();
  description = description.trim();
  if (!name || name.length > MAX_COLLECTION_NAME_LENGTH || !description) {
    throw new Error("Invalid collection");
  }
  if (!isAddress(owner)) {
    throw new Error("Invalid owner");
  }

  const metadata = {
    name,
    description,
    image: COLLECTION_IMAGE_URL,
    attributes: [{ trait_type: "Mode", value: "Solo" }],
    properties: { creators: [{ address: owner }] },
  };

  const groupId = await getOrCreateGroup(`solo-${owner}`);

  return uploadPublicFile({
    file: new File([JSON.stringify(metadata)], "collection.json", {
      type: "application/json",
    }),
    name: `collection-${slugify(name) || "collection"}.json`,
    groupId,
    keyvalues: { kind: "collection", owner, mode: "solo" },
  }).then((file) => ({ groupId, ...file }));
};
