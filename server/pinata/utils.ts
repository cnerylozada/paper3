import { createHash } from "node:crypto";
import { PINATA_GROUPS_URL, PINATA_UPLOAD_URL } from "../constants";
import {
  MAX_KEYWORD_LENGTH,
  MAX_KEYWORDS,
} from "@/components/collections/create/models";
import { Constants } from "@/lib/database.types";
import type { CollectionField } from "../models/collections";

// Finds a public group by its exact name, or creates it the first time
export const getOrCreateGroup = async (name: string) => {
  const headers = { Authorization: `Bearer ${process.env.PINATA_JWT}` };
  const url = PINATA_GROUPS_URL;

  const list = await fetch(`${url}?name=${encodeURIComponent(name)}`, {
    headers,
  });
  if (!list.ok) throw new Error("Could not read the groups");
  const { groups } = (await list.json()).data as {
    groups: { id: string; name: string }[];
  };
  // The name filter may match part of a name, so compare the whole name
  const existing = groups.find((group) => group.name === name);
  if (existing) return existing.id;

  const created = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!created.ok) {
    console.log("pinata error", created.status, await created.text());
    throw new Error("Could not create the group");
  }
  return (await created.json()).data.id as string;
};

// "Student Papers" -> "student-papers": no spaces or symbols in file names
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Group name of one collection: "solo-<12 hex of the owner's hash>-<slug>".
// Pinata limits group names to 50 characters and an address alone takes up to
// 44, so the address is hashed. 5 + 12 + 1 + 32 (the longest slug) = 50
export const collectionGroupName = (
  mode: "solo" | "team",
  owner: string, // the student's wallet, or the squad's multisig address
  collectionName: string,
) => {
  const ownerHash = createHash("sha256").update(owner).digest("hex");
  return `${mode}-${ownerHash.slice(0, 12)}-${slugify(collectionName)}`;
};

// Uploads one file to Pinata's public network, inside a group, and returns its
// CID and gateway URL. It lives here and not in a "use server" file on purpose:
// server actions are callable from the browser, this helper is not
export const uploadPublicFile = async ({
  file,
  name,
  groupId,
  keyvalues,
}: {
  file: File;
  name: string; // the file's name in Pinata
  groupId: string;
  keyvalues: Record<string, string>; // flat, Pinata only accepts strings
}) => {
  const formData = new FormData();
  formData.append("network", "public");
  formData.append("name", name);
  formData.append("keyvalues", JSON.stringify(keyvalues));
  formData.append("group_id", groupId);
  formData.append("file", file);

  const response = await fetch(PINATA_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    body: formData,
  });

  if (!response.ok) {
    console.log("pinata error", response.status, await response.text());
    throw new Error("Upload failed");
  }

  const { data } = await response.json();

  return {
    cid: data.cid as string,
    url: `https://${process.env.PINATA_GATEWAY}/ipfs/${data.cid}`,
  };
};

// The field and keywords every collection has, checked and written the same way
// for solo and team
export const isValidTopic = (field: CollectionField, keywords: string[]) =>
  Constants.public.Enums.collection_field.includes(field) &&
  keywords.length >= 1 &&
  keywords.length <= MAX_KEYWORDS &&
  keywords.every((k) => k && k.length <= MAX_KEYWORD_LENGTH);

export const topicAttributes = (field: CollectionField, keywords: string[]) => [
  { trait_type: "Field", value: field },
  { trait_type: "Keywords", value: keywords.join(", ") },
];
