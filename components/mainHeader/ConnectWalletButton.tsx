import { useLogin, usePrivy } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveUser } from "@/server/users";

export const ConnectWalletButton = () => {
  const router = useRouter();

  // ready: Privy has finished initializing (restored any previous session), so its state can be trusted.
  //        Before that, `authenticated` is always false, even for a user who is actually logged in.
  // authenticated: the user has a Privy session (logged in with Google or a wallet).
  //        Only meaningful once `ready` is true.
  const { ready, authenticated } = usePrivy();

  const { login } = useLogin({
    // The user is saved here and the redirect happens after it, so this button
    // stays mounted until the save finishes. The first login creates the user
    // row, later ones update it
    onComplete: async ({ user }) => {
      const wallet = user.linkedAccounts.find(
        (account) =>
          account.type === "wallet" && account.chainType === "solana",
      );

      try {
        if (wallet?.type === "wallet") {
          await saveUser({
            privyId: user.id,
            walletAddress: wallet.address,
            email: user.google?.email,
            name: user.google?.name ?? undefined,
          });
        }
      } catch (e) {
        console.error(e);
      }
      router.replace("/dashboard");
    },
    onError: (error) => console.error("Login error:", error),
  });

  return (
    <Button disabled={!ready || authenticated} onClick={() => login()}>
      <Wallet />
      Connect with Privy
    </Button>
  );
};
