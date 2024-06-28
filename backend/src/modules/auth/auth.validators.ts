import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false).optional(),
});

export const signUpSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).trim(),
  password: z.string().min(7),
});

export const verifyAccountSchema = z.object({
  otp: z.string().regex(/[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "Malformed OTP"),
});
