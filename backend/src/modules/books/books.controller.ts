import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { BooksService } from "./books.service";
import { BookWithAuthors } from "./types";

@Controller("books")
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get()
  async search(): Promise<BookWithAuthors[]> {
    return this.booksService.search();
  }

  @Get(":id")
  async get(@Req() req: Request): Promise<BookWithAuthors | null> {
    const bookId: number = Number(req.params.id);
    if (isNaN(bookId) || bookId < 0) {
      throw new BadRequestException("Invalid book id");
    }

    const book = await this.booksService.get(bookId);
    if (book === null) {
      throw new NotFoundException("Book not found");
    }

    return book;
  }
}
