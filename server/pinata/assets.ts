"use server";

import { MAX_SVG_SIZE } from "../constants";
import { uploadPublicFile } from "./utils";

// Uploads the SVG drawn from the PDF's hash to Pinata's public network and
// returns its URL. Runs on the server, so PINATA_JWT never reaches the browser
export const uploadPdfHashSvg = async ({
  svg,
  docHash,
  owner,
  mode,
  groupId,
}: {
  svg: string;
  docHash: string; // SHA-256 of the PDF, in hex
  owner: string; // the student's wallet, or the squad's multisig address
  mode: "solo" | "team";
  groupId: string; // the owner's public Pinata group, it must already exist
}) => {
  if (!svg.startsWith("<svg") || svg.length > MAX_SVG_SIZE) {
    throw new Error("Invalid SVG");
  }
  if (!/^[0-9a-f]{64}$/.test(docHash)) {
    throw new Error("Invalid hash");
  }

  // The first 12 characters of the hash tie the paper's files together
  return uploadPublicFile({
    file: new File([svg], "paper.svg", { type: "image/svg+xml" }),
    name: `asset-${docHash.slice(0, 12)}-image.svg`,
    groupId,
    keyvalues: { kind: "asset-image", owner, mode, docHash },
  });
};
