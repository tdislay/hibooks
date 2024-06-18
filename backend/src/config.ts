/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { CookieOptions } from "express";

export const APPLICATION = "application";
export const REDIS = "redis";
export const SESSION = "session";

const DEFAULT_SESSION_EXPIRATION = 60 * 60 * 24 * 30; // 30 days

export const configuration = () =>
  ({
    [APPLICATION]: {
      port: parseInt(process.env.PORT!, 10) || 3000,
      cookieSecret: process.env.COOKIE_SECRET,
    },
    [REDIS]: {
      password: process.env.REDIS_PASSWORD,
    },
    [SESSION]: {
      expirationInSeconds:
        parseInt(process.env.SESSION_EXPIRATION!, 10) ||
        DEFAULT_SESSION_EXPIRATION,
      prefix: process.env.SESSION_PREFIX ?? "session",
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge:
          parseInt(process.env.SESSION_EXPIRATION!, 10) ||
          DEFAULT_SESSION_EXPIRATION,
        signed: true,
      } satisfies CookieOptions,
      cookieName: process.env.SESSION_COOKIE_NAME ?? "session",
    },
  }) as const;

export type Configuration = ReturnType<typeof configuration>;
