"use client";

import { Book } from "backend";
import Link from "next/link";
import { ReactElement, useContext, useEffect, useState } from "react";
import BookTile from "./BookTile";
import { searchBooks } from "@/core/books";
import { UserContext } from "@/states/user";

export default function Home(): ReactElement {
  const { current } = useContext(UserContext);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    void fetchBooks();
  }, []);

  async function fetchBooks(): Promise<void> {
    // TODO: In reality we should rather fetch cached books list (new releases, popular books, etc.)
    const { result } = await searchBooks();

    setBooks(result ?? []);
  }

  return (
    <>
      {current?.verified === false && (
        <p>
          You need to{" "}
          <Link href="/auth/verify-account" className="text-blue-600 font-bold">
            verify your email
          </Link>
          .
        </p>
      )}

      <div className="grid grid-cols-4 gap-4 p-8">
        {books.map((book) => (
          <BookTile key={book.id} {...book} />
        ))}
      </div>
    </>
  );
}
