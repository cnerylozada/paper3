"use server";

import { isAddress } from "@solana/kit";
import { supabase } from "@/lib/supabase";

// Stores the user on their first login, later logins update the same row
// (matched by the Privy id)
export const saveUser = async ({
  privyId,
  walletAddress,
  email,
  name,
  avatarUrl,
}: {
  privyId: string;
  walletAddress: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}) => {
  if (!privyId.trim()) {
    throw new Error("Invalid user");
  }
  if (!isAddress(walletAddress)) {
    throw new Error("Invalid wallet");
  }

  const { error } = await supabase.from("users").upsert(
    {
      privy_id: privyId,
      wallet_address: walletAddress,
      email,
      name,
      avatar_url: avatarUrl,
    },
    { onConflict: "privy_id" },
  );

  if (error) {
    // 23505: the wallet or the email already belongs to another user
    if (error.code === "23505") {
      throw new Error("This user is already registered");
    }
    throw new Error("Could not save the user");
  }
};

// The id of the user (the one in the dashboard url) behind a wallet
export const getUserIdByWallet = async (walletAddress: string) => {
  if (!isAddress(walletAddress)) {
    throw new Error("Invalid wallet");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) {
    throw new Error("Could not get the user");
  }
  if (!data) {
    throw new Error("User not found");
  }
  return data.id;
};
