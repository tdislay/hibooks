import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { CreateUserDto, UserPrivate } from "./types";
import { PrismaService } from "src/infra/prisma";

const excludePasswordField: {
  [key in keyof UserPrivate]: true;
} & { password: false } = {
  id: true,
  username: true,
  email: true,
  verified: true,
  password: false,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getById(id: number): Promise<UserPrivate | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: excludePasswordField,
    });
  }

  async getByUsername(username: string): Promise<UserPrivate | null>;
  /**
   * @param includePassword Use only if the presence of the password field is strictly required.
   */
  async getByUsername(
    username: string,
    includePassword: true,
  ): Promise<User | null>;
  async getByUsername(
    username: string,
    includePassword: boolean = false,
  ): Promise<UserPrivate | User | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        ...excludePasswordField,
        password: includePassword,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<UserPrivate> {
    return this.prisma.user.create({
      data: { ...createUserDto },
      select: excludePasswordField,
    });
  }

  async verifyUserAccount(id: number): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { verified: true } });
  }
}
