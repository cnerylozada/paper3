"use server";

import { isAddress } from "@solana/kit";
import { uploadPublicFile } from "./utils";

// Builds the solo asset JSON (docs/metadata/solo/asset.json) and uploads it to
// Pinata's public network. The returned URL is the asset's on-chain `uri`.
// It has no external_url yet: that needs the asset's address, minted later
export const uploadSoloAsset = async ({
  name,
  description,
  field,
  language,
  image,
  docHash,
  owner,
  groupId,
}: {
  name: string;
  description: string;
  field: string;
  language: string;
  image: string; // URL of the SVG drawn from the PDF's hash
  docHash: string; // SHA-256 of the PDF, in hex
  owner: string; // the student's wallet, its only creator
  groupId: string; // the collection's public Pinata group
}) => {
  name = name.trim();
  description = description.trim();
  field = field.trim();
  language = language.trim();
  if (!name || !description || !field || !language) {
    throw new Error("Invalid paper");
  }
  if (!/^[0-9a-f]{64}$/.test(docHash)) {
    throw new Error("Invalid hash");
  }
  if (!isAddress(owner)) {
    throw new Error("Invalid owner");
  }

  const metadata = {
    name,
    description,
    image,
    attributes: [
      { trait_type: "Status", value: "Draft" },
      { trait_type: "Field", value: field },
      { trait_type: "Language", value: language },
      { trait_type: "Created", value: new Date().toISOString().slice(0, 10) },
      { trait_type: "Document Hash (SHA-256)", value: docHash },
    ],
    properties: { creators: [{ address: owner }], category: "image" },
  };

  return uploadPublicFile({
    file: new File([JSON.stringify(metadata)], "asset.json", {
      type: "application/json",
    }),
    name: `asset-${docHash.slice(0, 12)}.json`,
    groupId,
    keyvalues: { kind: "asset", owner, mode: "solo", docHash },
  });
};
