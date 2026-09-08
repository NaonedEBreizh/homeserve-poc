import { z } from "zod";

/**
 * Runtime environment contract. Parsed once at module load so a
 * misconfigured deployment fails fast instead of at first request.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  /** Public origin used to build absolute URLs. */
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

type EnvSource = Record<string, string | undefined>;

function parseEnv(source: EnvSource = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return parsed.data;
}

export { envSchema, parseEnv };
export type { EnvSource };

export const env: Env = parseEnv();
