/* eslint-disable @typescript-eslint/naming-convention */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// "password" hashed with bcrypt
const password = "$2y$10$TPb1qYziiIcGLfHqNMQ9mepz9s5sckqrshSRtEJ91n0OK0oGE03ry";
const userData: Prisma.UserCreateManyInput[] = [
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

const genreData: Prisma.GenreCreateManyInput[] = [{ name: "Thriller" }];

const seriesData: Prisma.SeriesCreateManyInput[] = [
  { name: "La trilogie du mal" },
];

const publisherData: Prisma.PublisherCreateManyInput[] = [{ name: "POCKET" }];

const bookData: Prisma.BookCreateManyInput[] = [
  {
    isbn13: "9782266127035",
    title: "L'âme du mal",
    parutionDate: new Date("2004-03-11"),
    summary: `Abandonnés au fond de la forêt ou de hangars vétustes, des cadavres comme on n'en a jamais vu, mutilés de façon rituelle, porteurs de messages cabalistiques semblables à ceux que laissait derrière lui le bourreau de Portland, avant qu'une balle dans la tête ne vienne à bout de sa carrière... Le tueur serait-il revenu d'outre-tombe ? S'agit-il d'une secte particulière qui prélève toujours les mêmes morceaux du corps de ses victimes pour d'étranges cérémonies ?
    Des bibliothèques ésotériques aux égouts de la ville, l'inspecteur Brolin et une jeune étudiante en psychologie plongent dans une enquête infernale, tandis que la police scientifique et la médecine légale se perdent en conjectures. Et peu à peu, des brumes mystérieuses de la Willamette River va surgir un secret effroyable que nos deux limiers devront affronter au péril de leur âme.`,
    pages: 514,
    coverFilename: "244a33fd_l_ame_du_mal.jpg",
    genreId: 1,
    publisherId: 1,
    seriesId: 1,
  },
  {
    isbn13: "9782840989042",
    title: "In Tenebris",
    parutionDate: new Date("2004-03-11"),
    summary: `Des ténèbres, nul ne sort indemne. Les propos de Julia, retrouvée scalpée, errant dans les rues de Brooklyn, n'ont de sens que pour elle. Elle affirme sortir de l'Enfer, avoir échappé au Diable lui-même. Et n'être pas la seule...
    Sous la neige new-yorkaise, couve un feu de tourments – un bûcher d'innocents. Le profileur Joshua Brolin sait qu'il lui faudra y plonger.
    Sans espoir de salut...`,
    pages: 599,
    coverFilename: "063184c2_in_tenebris.jpg",
    genreId: 1,
    publisherId: 1,
    seriesId: 1,
  },
];

const authorData: Prisma.AuthorCreateInput[] = [
  {
    firstname: "Maxime",
    lastname: "Chattam",
    description: `Maxime Guy Sylvain Drouot, connu sous les noms de plume Maxime Chattam et Maxime Williams, est un romancier français, spécialisé dans le thriller.

  Au cours de son enfance, il fait de fréquents séjours aux États-Unis: sa première destination en 1987 est Portland dans l'Oregon, ville qui lui inspirera son premier roman.`,
    Book: { connect: [{ id: 1 }, { id: 2 }] },
  },
];

async function truncateTables(tableNames: string[]): Promise<void> {
  const quotedTableNames = tableNames
    .map((tableName) => `"${tableName}"`)
    .join(",");
  await prisma.$queryRaw`TRUNCATE TABLE ${Prisma.raw(quotedTableNames)} RESTART IDENTITY;`;
}

export async function applyFixtures(): Promise<void> {
  await truncateTables([
    "User",
    "Genre",
    "Publisher",
    "Series",
    "Book",
    "Author",
    "_AuthorToBook", // Implicit table created by Prisma
  ]);

  await prisma.user.createMany({ data: userData });
  await prisma.genre.createMany({ data: genreData });
  await prisma.publisher.createMany({ data: publisherData });
  await prisma.series.createMany({ data: seriesData });
  await prisma.book.createMany({ data: bookData });

  // We need to iterate over the author data to create the relations (many to many is not possible in createMany)
  // https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#create-multiple-records-and-multiple-related-records
  for (const author of authorData) {
    await prisma.author.create({ data: author });
  }
}
