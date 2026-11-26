import { PINATA_GROUPS_URL, PINATA_UPLOAD_URL } from "../constants";

// A student has one public group, named after the wallet. The first upload
// creates it, the next ones reuse it
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
