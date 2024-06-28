import { z } from "zod";
import { UserPrivate } from "../types";
import {
  loginSchema,
  signUpSchema,
  verifyAccountSchema,
} from "./auth.validators";

// Login
export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = UserPrivate;

// Sign up
export type SignUpRequest = z.infer<typeof signUpSchema>;
export type SignUpResponse = UserPrivate;

//  Verify account
export type VerifyAccountRequest = z.infer<typeof verifyAccountSchema>;
export type VerifyAccountResponse = void;

// Me
export type MeRequest = Record<string, never>;
export type MeResponse = UserPrivate;

// Logout
export type LogoutRequest = Record<string, never>;
export type LogoutResponse = void;
