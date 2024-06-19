import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// "password" hashed with bcrypt
const password = "$2y$10$TPb1qYziiIcGLfHqNMQ9mepz9s5sckqrshSRtEJ91n0OK0oGE03ry";
const userData: Prisma.UserCreateInput[] = [
  {
    email: "alice@gmail.com",
    username: "alice",
    password,
    verified: true,
  },
  {
    email: "bob@outlook.com",
    username: "bob",
    password,
    verified: true,
  },
];

async function truncateTable(tableName: string): Promise<void> {
  const quotedTableName = Prisma.raw(`"${tableName}"`);
  await prisma.$queryRaw`TRUNCATE TABLE ${quotedTableName} RESTART IDENTITY;`;
}

export async function applyFixtures(): Promise<void> {
  await truncateTable("User");

  await prisma.user.createMany({ data: userData });
}
