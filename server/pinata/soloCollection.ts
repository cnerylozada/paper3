"use server";

import { isAddress } from "@solana/kit";
import {
  MAX_COLLECTION_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/components/collections/create/models";
import { byteLength, COLLECTION_IMAGE_URL } from "../constants";
import type { CollectionField } from "../models/collections";
import {
  collectionGroupName,
  getOrCreateGroup,
  isValidTopic,
  slugify,
  topicAttributes,
  uploadPublicFile,
} from "./utils";

// Builds the solo collection JSON (docs/metadata/solo/collection.json) and
// uploads it to Pinata's public network. The returned URL is the collection's
// on-chain `uri`
export const uploadSoloCollection = async ({
  name,
  description,
  field,
  keywords,
  owner,
}: {
  name: string;
  description: string;
  field: CollectionField;
  keywords: string[];
  owner: string; // the student's wallet, its only creator
}) => {
  name = name.trim();
  description = description.trim();
  keywords = keywords.map((keyword) => keyword.trim());
  if (
    !name ||
    byteLength(name) > MAX_COLLECTION_NAME_LENGTH ||
    !slugify(name) ||
    !description ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    !isValidTopic(field, keywords)
  ) {
    throw new Error("Invalid collection");
  }
  if (!isAddress(owner)) {
    throw new Error("Invalid owner");
  }

  const metadata = {
    name,
    description,
    image: COLLECTION_IMAGE_URL,
    attributes: [
      { trait_type: "Mode", value: "Solo" },
      ...topicAttributes(field, keywords),
    ],
    properties: { creators: [{ address: owner }] },
  };

  // One public group per collection, so its JSON and its papers stay together
  const groupId = await getOrCreateGroup(
    collectionGroupName("solo", owner, name),
  );

  return uploadPublicFile({
    file: new File([JSON.stringify(metadata)], "collection.json", {
      type: "application/json",
    }),
    name: "collection.json",
    groupId,
    keyvalues: { kind: "collection", owner, mode: "solo" },
  }).then((file) => ({ groupId, ...file }));
};
