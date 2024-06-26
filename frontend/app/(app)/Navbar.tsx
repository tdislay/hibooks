"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactElement, useContext } from "react";
import { UserContext } from "@/api/user/UserContext";
import Button from "@/components/ui/Button";
import owliverSvg from "@/public/owliver.svg";

export default function Navbar(): ReactElement {
  const { user, logout } = useContext(UserContext);

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-100">
      <Link href="/" className="flex items-center space-x-2 text-2xl font-bold">
        <Image src={owliverSvg} alt="Owlivr" width={36} height={36} />
        <span>Hibooks</span>
      </Link>

      <div className="flex items-center space-x-4">
        {user === null ? (
          <>
            <Button href="/auth/sign-up" variant="secondary">
              Sign Up
            </Button>
            <Button href="/auth/login">Login</Button>
          </>
        ) : (
          <>
            <p>{user.username} ▼</p>

            <Button onClick={logout} variant="secondary">
              Logout
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
