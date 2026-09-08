import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("applies defaults when optional variables are absent", () => {
    const env = parseEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("accepts a valid explicit configuration", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://homeserve.example.com",
    });

    expect(env.NODE_ENV).toBe("production");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://homeserve.example.com");
  });

  it("rejects a malformed app URL", () => {
    expect(() =>
      parseEnv({ NEXT_PUBLIC_APP_URL: "not-a-url" }),
    ).toThrow(/Invalid environment variables/);
  });
});
