"use client";

import Link from "next/link";
import { ReactElement, useContext } from "react";
import { UserContext } from "@/states/user";

export default function Home(): ReactElement {
  const { current } = useContext(UserContext);

  return (
    <>
      <h1>
        Hello {current?.username}.
        {current?.verified === false && (
          <p>
            You need to{" "}
            <Link
              href="/auth/verify-account"
              className="text-blue-600 font-bold"
            >
              verify your email
            </Link>
            .
          </p>
        )}
      </h1>
    </>
  );
}
