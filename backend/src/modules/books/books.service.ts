import { Injectable } from "@nestjs/common";
import { BookWithAuthors } from "./types";
import { PrismaService } from "src/infra/prisma";

@Injectable()
export class BooksService {
  constructor(private prismaService: PrismaService) {}

  async search(): Promise<BookWithAuthors[]> {
    return this.prismaService.book.findMany({
      include: { authors: true, publisher: true },
    });
  }

  async get(id: number): Promise<BookWithAuthors | null> {
    return this.prismaService.book.findUnique({
      where: { id },
      include: {
        authors: true,
        genre: true,
        series: true,
        publisher: true,
      },
    });
  }
}
