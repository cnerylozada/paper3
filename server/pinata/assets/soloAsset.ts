"use server";

import { isAddress } from "@solana/kit";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PDF_BYTES,
  MAX_TITLE_LENGTH,
  MAX_WHATS_NEW_LENGTH,
} from "@/components/assets/models";
import { Constants } from "@/lib/database.types";
import type { AssetDocumentType, AssetLanguage } from "../../models/assets";
import {
  collectionGroupName,
  getOrCreateGroup,
  uploadPublicFile,
} from "../utils";

const HASH = /^[0-9a-f]{64}$/;
const VERSION = /^v[0-9]+\.[0-9]+$/;

// The public group of a solo collection, where its JSON, SVGs and PDFs live
export const getSoloCollectionGroupId = async ({
  collectionName,
  owner,
}: {
  collectionName: string;
  owner: string; // the student's wallet
}) => {
  if (!collectionName.trim() || !isAddress(owner)) {
    throw new Error("Invalid collection");
  }
  return getOrCreateGroup(collectionGroupName("solo", owner, collectionName));
};

// Builds the JSON of a version (docs/metadata/solo/asset.json) from the form's
// values and uploads it to Pinata's public network. The returned URL is the
// asset's on-chain `uri`
export const uploadSoloAssetMetadata = async ({
  version,
  title,
  description,
  documentType,
  language,
  whatsNew,
  image,
  docHash,
  owner,
  groupId,
}: {
  version: string;
  title: string;
  description: string;
  documentType: AssetDocumentType;
  language: AssetLanguage;
  whatsNew: string;
  image: string; // URL of the SVG drawn from the PDF's hash
  docHash: string; // SHA-256 of the PDF, in hex
  owner: string; // the student's wallet, its only creator
  groupId: string; // the collection's public Pinata group
}) => {
  title = title.trim();
  description = description.trim();
  whatsNew = whatsNew.trim();
  if (
    !VERSION.test(version) ||
    !title ||
    title.length > MAX_TITLE_LENGTH ||
    !description ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    whatsNew.length > MAX_WHATS_NEW_LENGTH ||
    !Constants.public.Enums.asset_document_type.includes(documentType) ||
    !Constants.public.Enums.asset_language.includes(language)
  ) {
    throw new Error("Invalid version");
  }
  if (!HASH.test(docHash)) throw new Error("Invalid hash");
  if (!isAddress(owner)) throw new Error("Invalid owner");

  const metadata = {
    name: title,
    description,
    image,
    attributes: [
      { trait_type: "Version", value: version },
      { trait_type: "Document type", value: documentType },
      { trait_type: "Language", value: language },
      ...(whatsNew ? [{ trait_type: "What's new", value: whatsNew }] : []),
      { trait_type: "Created", value: new Date().toISOString().slice(0, 10) },
      { trait_type: "Document Hash (SHA-256)", value: docHash },
    ],
    properties: { creators: [{ address: owner }], category: "image" },
  };

  return uploadPublicFile({
    file: new File([JSON.stringify(metadata)], "asset.json", {
      type: "application/json",
    }),
    name: `${version}-asset.json`,
    groupId,
    keyvalues: { kind: "asset", owner, mode: "solo", docHash, version },
  });
};

// Uploads the paper's PDF to Pinata's public network, in the collection's group
export const uploadSoloAssetPdf = async ({
  file,
  version,
  docHash,
  owner,
  groupId,
}: {
  file: File;
  version: string; // like v1.0, unique inside the collection
  docHash: string; // SHA-256 of the PDF, in hex
  owner: string;
  groupId: string;
}) => {
  if (!VERSION.test(version)) throw new Error("Invalid version");
  if (!HASH.test(docHash)) throw new Error("Invalid hash");
  if (!isAddress(owner)) throw new Error("Invalid owner");
  if (file.type !== "application/pdf" || file.size > MAX_PDF_BYTES) {
    throw new Error("Invalid PDF");
  }

  return uploadPublicFile({
    file,
    name: `${version}-paper.pdf`,
    groupId,
    keyvalues: { kind: "asset-pdf", owner, mode: "solo", docHash, version },
  });
};
