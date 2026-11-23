import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Privy stores its session in cookies on the browser:
// - `privy-token`: the access token (short-lived)
// - `privy-session`: present while the user has a refreshable session
// This only checks presence. It is a UX gate, not security: the token is NOT
// verified here, so never serve private data from these pages without
// verifying it on the server.
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("privy-token") || request.cookies.has("privy-session");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Only the private pages; everything else stays public
export const config = {
  matcher: ["/dashboard/:path*", "/favorites/:path*", "/swap/:path*"],
};
