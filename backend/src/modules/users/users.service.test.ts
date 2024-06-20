import { Test } from "@nestjs/testing";
import { User } from "@prisma/client";
import { UserPasswordOmitted, UsersService } from "./users.service";
import { PrismaService } from "src/infra/prisma";

describe("UserService", () => {
  let usersService: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    usersService = moduleRef.get(UsersService);
  });

  it("Should get user by username without including password", async () => {
    const user = await usersService.getByUsername("alice");

    expect(user).toEqual<UserPasswordOmitted>({
      id: 1,
      username: "alice",
      email: "alice@gmail.com",
      verified: true,
    });
  });

  it("Should get user by username with password", async () => {
    const user = await usersService.getByUsername("bob", true);

    expect(user).toEqual<User>({
      id: 2,
      username: "bob",
      email: "bob@outlook.com",
      password: "$2y$10$TPb1qYziiIcGLfHqNMQ9mepz9s5sckqrshSRtEJ91n0OK0oGE03ry",
      verified: true,
    });
  });
});
