import { z } from "zod";
import { UserPrivate } from "../types";

// Login
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = UserPrivate;

// Sign up
export const signUpSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).trim(),
  password: z.string().min(7),
});

export type SignUpRequest = z.infer<typeof signUpSchema>;
export type SignUpResponse = UserPrivate;

//  Verify account
export const verifyAccountSchema = z.object({
  otp: z.string().regex(/[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "Malformed OTP"),
});

export type VerifyAccountRequest = z.infer<typeof verifyAccountSchema>;
export type VerifyAccountResponse = void;

// Me
export type MeRequest = void;
export type MeResponse = UserPrivate;

// Logout
export type LogoutRequest = void;
export type LogoutResponse = void;
