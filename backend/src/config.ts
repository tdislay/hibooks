/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { CookieOptions } from "express";
import { z } from "zod";

const DEFAULT_SESSION_EXPIRATION = 60 * 60 * 24 * 30; // 30 days

export function validateEnvironment(
  env: Record<string, unknown>
): Record<string, unknown> {
  return z
    .object({
      // Optionals
      PORT: z.number().min(1!).max(65535).optional(),
      SESSION_EXPIRATION: z.number().optional(),
      SESSION_PREFIX: z.string().min(3).optional(),
      SESSION_COOKIE_NAME: z.string().min(3).optional(),

      // Required
      REDIS_PASSWORD: z.string().min(8),
      FRONTEND_URL: z.string().url(),
      HS256_SECRET: z.string().min(32),
      EMAIL_SES_ACCESS_KEY: z.string(),
      EMAIL_SES_SECRET_KEY: z.string(),
    })
    .parse(env);
}

export const configuration = () =>
  ({
    application: {
      port: Number(process.env.PORT) || 3000,
      hs256Secret: process.env.HS256_SECRET!,
    },
    frontend: {
      url: process.env.FRONTEND_URL!,
    },
    redis: {
      password: process.env.REDIS_PASSWORD!,
    },
    session: {
      expirationInSeconds:
        Number(process.env.SESSION_EXPIRATION) || DEFAULT_SESSION_EXPIRATION,
      prefix: process.env.SESSION_PREFIX ?? "session",
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge:
          Number(process.env.SESSION_EXPIRATION) || DEFAULT_SESSION_EXPIRATION,
        signed: true,
      } satisfies CookieOptions,
      cookieName: process.env.SESSION_COOKIE_NAME ?? "session",
    },
    email: {
      accessKeyId: process.env.EMAIL_SES_ACCESS_KEY,
      secretAccessKey: process.env.EMAIL_SES_SECRET_KEY,
    },
  }) as const;

export type Configuration = ReturnType<typeof configuration>;
