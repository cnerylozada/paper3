import { usePrivy } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ConnectWalletButton = () => {
  // ready: Privy has finished initializing (restored any previous session), so its state can be trusted.
  //        Before that, `authenticated` is always false, even for a user who is actually logged in.
  // authenticated: the user has a Privy session (logged in with Google or a wallet).
  //        Only meaningful once `ready` is true.
  const { ready, authenticated, login } = usePrivy();

  return (
    <Button disabled={!ready || authenticated} onClick={() => login()}>
      <Wallet />
      Connect with Privy
    </Button>
  );
};
