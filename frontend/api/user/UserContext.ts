"use client";

import { Dispatch, createContext, useState } from "react";
import { api } from "../api";

// Just get type from backend
export type User = {
  id: number;
  email: string;
  username: string;
};
type LoginDto = {
  username: string;
  password: string;
  rememberMe: boolean;
};

type UserContext = {
  user: User | null;
  login: (loginDto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
};

export function useUserContext(): UserContext {
  const [user, setUser] = useState<User | null>(null);

  return {
    user,
    login: async (loginDto: LoginDto) => {
      const loggedInUser = await api.post<LoginDto, User>(
        "/auth/login",
        loginDto,
      );

      console.log(loggedInUser);
      if (loggedInUser === null) {
        throw new Error("Login failed");
      }

      setUser(loggedInUser);
    },
    logout: async () => {
      await api.post("/auth/logout");

      setUser(null);
    },
  };
}

export const UserContext = createContext<UserContext>({
  user: { username: "alice", id: 0, email: "alice@example.com" },
  login: async () => {},
  logout: async () => {},
});
