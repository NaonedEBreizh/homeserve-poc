import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Strict, nonce-based Content-Security-Policy.
 *
 * The nonce is injected per-request by `middleware.ts`; Next.js reads it back
 * from the request's `content-security-policy` header and stamps it onto the
 * framework's own inline bootstrap scripts. `strict-dynamic` then lets those
 * trusted scripts load the chunks they need, without ever allowing
 * `unsafe-inline` for scripts.
 *
 * In development the policy is relaxed just enough for Turbopack HMR
 * (eval-based module wrapping + the dev websocket).
 */
export function buildContentSecurityPolicy(nonce?: string): string {
  const scriptSrc = [
    "'self'",
    nonce ? `'nonce-${nonce}'` : null,
    "'strict-dynamic'",
    isDev ? "'unsafe-eval'" : null,
  ].filter(Boolean);

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Tailwind/Next inject <style> tags at runtime; there is no nonce hook for them.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${isDev ? "'self' ws: wss:" : "'self'"}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * Security headers that do not depend on a per-request nonce.
 * The CSP itself is emitted by `middleware.ts` so it can carry that nonce.
 */
export const staticSecurityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: staticSecurityHeaders }];
  },
};

export default nextConfig;
