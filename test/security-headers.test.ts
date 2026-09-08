import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  staticSecurityHeaders,
} from "@/next.config";

function directive(csp: string, name: string): string | undefined {
  return csp
    .split("; ")
    .find((part) => part === name || part.startsWith(`${name} `));
}

describe("buildContentSecurityPolicy", () => {
  it("locks down the dangerous fetch directives", () => {
    const csp = buildContentSecurityPolicy("abc123");

    expect(directive(csp, "default-src")).toBe("default-src 'self'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'none'");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "form-action")).toBe("form-action 'self'");
  });

  it("carries the per-request nonce and never allows inline scripts", () => {
    const csp = buildContentSecurityPolicy("abc123");
    const scriptSrc = directive(csp, "script-src");

    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("omits the nonce token when no nonce is supplied", () => {
    expect(buildContentSecurityPolicy()).not.toContain("nonce-");
  });
});

describe("staticSecurityHeaders", () => {
  const headers = new Map(staticSecurityHeaders.map((h) => [h.key, h.value]));

  it("enables HSTS for at least two years, including subdomains", () => {
    const hsts = headers.get("Strict-Transport-Security");

    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");

    const maxAge = Number(/max-age=(\d+)/.exec(hsts ?? "")?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(63072000);
  });

  it("denies framing and MIME sniffing", () => {
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets a privacy-preserving referrer policy", () => {
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("denies the high-risk browser features via Permissions-Policy", () => {
    const permissions = headers.get("Permissions-Policy") ?? "";

    for (const feature of ["camera", "microphone", "geolocation", "payment"]) {
      expect(permissions).toContain(`${feature}=()`);
    }
  });
});
