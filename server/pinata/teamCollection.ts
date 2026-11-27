"use server";

import { isAddress } from "@solana/kit";
import {
  COLLECTION_IMAGE_URL,
  byteLength,
  MAX_COLLECTION_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_MEMBERS,
  MIN_MEMBERS,
} from "../constants";
import {
  collectionGroupName,
  getOrCreateGroup,
  slugify,
  uploadPublicFile,
} from "./utils";

// Builds the team collection JSON (docs/metadata/team/collection.json) and
// uploads it to Pinata's public network. The returned URL is the collection's
// on-chain `uri`
export const uploadTeamCollection = async ({
  name,
  description,
  squad,
  members,
}: {
  name: string;
  description: string;
  squad: string; // the squad's multisig address
  members: string[]; // the squad's wallets, every one is a creator
}) => {
  name = name.trim();
  description = description.trim();
  if (
    !name ||
    byteLength(name) > MAX_COLLECTION_NAME_LENGTH ||
    !slugify(name) ||
    !description ||
    description.length > MAX_DESCRIPTION_LENGTH
  ) {
    throw new Error("Invalid collection");
  }
  if (!isAddress(squad)) {
    throw new Error("Invalid squad");
  }
  if (
    members.length < MIN_MEMBERS ||
    members.length > MAX_MEMBERS ||
    !members.every(isAddress) ||
    new Set(members).size !== members.length
  ) {
    throw new Error("Invalid members");
  }

  const metadata = {
    name,
    description,
    image: COLLECTION_IMAGE_URL,
    attributes: [
      { trait_type: "Mode", value: "Team" },
      { trait_type: "Squad", value: squad },
    ],
    properties: { creators: members.map((address) => ({ address })) },
  };

  // The squad has one public group, like a student has one
  // One public group per collection, so its JSON and its papers stay together
  const groupId = await getOrCreateGroup(
    collectionGroupName("team", squad, name),
  );

  return uploadPublicFile({
    file: new File([JSON.stringify(metadata)], "collection.json", {
      type: "application/json",
    }),
    name: "collection.json",
    groupId,
    keyvalues: {
      kind: "collection",

      owner: squad,
      mode: "team",
    },
  }).then((file) => ({ groupId, ...file }));
};
