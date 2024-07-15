import { Author, Book } from "@prisma/client";
import { z } from "zod";
import { getBookSchema, searchBookSchema } from "./books.validator";

export type BookWithAuthors = Book & { authors: Author[] };

// Search books
export type SearchBooksRequest = z.infer<typeof searchBookSchema>;
export type SearchBookResponse = BookWithAuthors[];

// Get book
export type GetBookRequest = z.infer<typeof getBookSchema>;
export type GetBookResponse = BookWithAuthors | null;
