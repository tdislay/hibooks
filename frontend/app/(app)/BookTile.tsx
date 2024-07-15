import { BookWithAuthors } from "backend";
import Image from "next/image";
import { ReactElement } from "react";

export default function BookTile(book: BookWithAuthors): ReactElement {
  const S3_BUCKET_COVERS_URL = new URL(
    "covers/",
    process.env.NEXT_PUBLIC_S3_BUCKET_URL,
  );

  return (
    <div className="bg-white rounded-lg shadow-md min-w-64">
      {book.coverFilename === null ? (
        <Image
          src="/placeholder.png"
          alt=""
          width={200}
          height={300}
          role="presentation"
        />
      ) : (
        <Image
          src={new URL(book.coverFilename, S3_BUCKET_COVERS_URL).toString()}
          alt=""
          width={200}
          height={300}
          role="presentation"
          className="rounded-t-lg"
        />
      )}
      <h2 className="text-xl whitespace-pre-wrap">
        {book.authors
          .map((author) => `${author.firstname} ${author.lastname}`)
          .join(", ")}{" "}
        - {book.title}
      </h2>
    </div>
  );
}
