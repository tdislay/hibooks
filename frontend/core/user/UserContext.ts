"use client";

import {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  UserPrivate,
} from "backend";
import { createContext, useContext, useState } from "react";
import { ApiError, api } from "../api";

type UserContext = {
  current: Readonly<UserPrivate | null>;
  isAuthenticated: boolean;
  login: (body: LoginRequest) => Promise<{ error: ApiError | null }>;
  signUp: (body: SignUpRequest) => Promise<{ error: ApiError | null }>;
  verifyAccount: (otp: string) => Promise<{ error: ApiError | null }>;
  logout: () => Promise<{ error: ApiError | null }>;
};

// ! `{} as never`is a hack to make TS happy.
// ! But the UserContext is a global context provided in the root layout.
// ! So the UserContext will always be available.
export const UserContext = createContext<UserContext>({} as never);
export const useUser = (): UserContext => useContext(UserContext);

export function useInitUserContext(
  userDefault: UserPrivate | null,
): UserContext {
  const [user, setUser] = useState<UserPrivate | null>(userDefault);

  return {
    current: user,

    get isAuthenticated(): boolean {
      return user !== null;
    },

    async login(body: LoginRequest) {
      const { result, error } = await api.post<LoginRequest, LoginResponse>(
        "/auth/login",
        body,
      );

      if (error !== null) {
        return { error };
      }

      setUser(result);
      return { error: null };
    },

    async signUp(body: SignUpRequest) {
      const { result, error } = await api.post<SignUpRequest, SignUpResponse>(
        "/auth/sign-up",
        body,
      );

      if (error !== null) {
        return { error };
      }

      setUser(result);
      return { error: null };
    },

    async verifyAccount(otp: string) {
      const { error } = await api.post("/auth/verify-account", { otp });

      if (error !== null) {
        return { error };
      }

      if (user !== null) {
        user.verified = true;
      }
      return { error: null };
    },

    async logout() {
      const { error } = await api.post("/auth/logout");

      setUser(null);

      return { error };
    },
  };
}
