import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "src/infra/prisma";

export type UserPasswordOmitted = Omit<User, "password">;

const excludePasswordField: {
  [key in keyof UserPasswordOmitted]: true;
} & { password: false } = {
  id: true,
  username: true,
  email: true,
  password: false,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getById(id: number): Promise<UserPasswordOmitted | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: excludePasswordField,
    });
  }

  async getByUsername(username: string): Promise<UserPasswordOmitted | null>;
  /**
   * @param includePassword Use only if the presence of the password field is strictly required.
   */
  async getByUsername(
    username: string,
    includePassword: true
  ): Promise<User | null>;
  async getByUsername(
    username: string,
    includePassword: boolean = false
  ): Promise<UserPasswordOmitted | User | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        ...excludePasswordField,
        password: includePassword,
      },
    });
  }
}
