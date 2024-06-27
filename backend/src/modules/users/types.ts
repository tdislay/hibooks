import { User } from "@prisma/client";

/**
 * Represents a user with sensitive informations (except for password)
 * Reserved for a user about themself / for admin purposes
 */
export type UserPrivate = Omit<User, "password">;

export type UserPublic = Omit<UserPrivate, "email" | "verified" | "id">;

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
}
