import { NextResponse, type NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "./next.config";

/**
 * Emits the strict CSP with a fresh per-request nonce.
 *
 * The nonce is set on the *request* headers as well, because that is where
 * Next.js looks for it when stamping its own inline bootstrap scripts.
 */
export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);

  return response;
}

export const config = {
  // Skip static assets and image optimisation: they are not HTML documents,
  // so they never need a nonce.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
