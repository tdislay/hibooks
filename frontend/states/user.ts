"use client";

import {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  UserPrivate,
} from "backend";
import { createContext, useContext, useState } from "react";
import { ApiError, api } from "../core/api";

type UserState = {
  current: Readonly<UserPrivate | null>;
  isAuthenticated: boolean;
  login: (body: LoginRequest) => Promise<{ error: ApiError | null }>;
  signUp: (body: SignUpRequest) => Promise<{ error: ApiError | null }>;
  sendVerificationEmail: () => Promise<{ error: ApiError | null }>;
  verifyAccount: (otp: string) => Promise<{ error: ApiError | null }>;
  logout: () => Promise<{ error: ApiError | null }>;
};

// ! `{} as never` is a hack to make TS happy.
// ! But this context is a global context provided in the root layout.
// ! So this context will always be available.
export const UserContext = createContext<UserState>({} as never);
export const useUser = (): UserState => useContext(UserContext);

export function useInitUserContext(userDefault: UserPrivate | null): UserState {
  const [user, setUser] = useState<UserPrivate | null>(userDefault);

  return {
    current: user,

    get isAuthenticated(): boolean {
      return user !== null;
    },

    login: async (body: LoginRequest) => {
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

    async sendVerificationEmail() {
      const { error } = await api.post("/auth/verification-email");

      if (error !== null) {
        return { error };
      }

      return { error: null };
    },

    async verifyAccount(otp: string) {
      const { error } = await api.post("/auth/verify-account", { otp });

      if (error !== null) {
        return { error };
      }

      if (user !== null) {
        user.verified = true;
        setUser(user);
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
