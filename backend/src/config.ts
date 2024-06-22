/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { CookieOptions } from "express";
import { z } from "zod";

const config = z.object({
  // Optionals
  PORT: z.number().min(1!).max(65535).default(3000),
  SESSION_EXPIRATION: z.number().default(60 * 60 * 24 * 30), // 30 days
  SESSION_PREFIX: z.string().min(3).default("session"),
  SESSION_COOKIE_NAME: z.string().min(3).default("session"),

  // Required
  REDIS_PASSWORD: z.string().min(8),
  FRONTEND_URL: z.string().url(),
  HS256_SECRET: z.string().min(32),
  EMAIL_SES_ACCESS_KEY: z.string(),
  EMAIL_SES_SECRET_KEY: z.string(),
});

// Need typescript inference
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function configuration() {
  const env = config.parse(process.env);

  return {
    application: {
      port: env.PORT,
      hs256Secret: env.HS256_SECRET,
    },
    frontend: {
      url: env.FRONTEND_URL,
    },
    redis: {
      password: env.REDIS_PASSWORD,
    },
    session: {
      expirationInSeconds: env.SESSION_EXPIRATION,
      prefix: env.SESSION_PREFIX,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: env.SESSION_EXPIRATION,
        signed: true,
      } satisfies CookieOptions,
      cookieName: env.SESSION_COOKIE_NAME,
    },
    email: {
      accessKeyId: env.EMAIL_SES_ACCESS_KEY,
      secretAccessKey: env.EMAIL_SES_SECRET_KEY,
    },
  };
}

export type Configuration = ReturnType<typeof configuration>;
