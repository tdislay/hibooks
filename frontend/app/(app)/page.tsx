import Link from "next/link";
import { ReactElement } from "react";

export default function Home(): ReactElement {
  return (
    <>
      <nav>
        <Link href="/auth/sign-up">Sign Up</Link>
        <Link href="/auth/login">Login</Link>
      </nav>
    </>
  );
}
