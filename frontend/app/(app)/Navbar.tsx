"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactElement, useContext, useState } from "react";
import { SearchBar } from "@/components/forms/SearchBar";
import Button from "@/components/ui/Button";
import owliverSvg from "@/public/owliver.svg";
import { UserContext } from "@/states/user";

export default function Navbar(): ReactElement {
  const [searchValue, setSearchValue] = useState("");

  const { current: user, isAuthenticated, logout } = useContext(UserContext);

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-100">
      <div className="flex items-center">
        <Link
          href="/"
          className="flex items-center space-x-2 text-2xl font-bold"
        >
          <Image src={owliverSvg} alt="Owlivr" width="36" />
          <span>Hibooks</span>
        </Link>

        <SearchBar value={searchValue} onChange={setSearchValue} />
      </div>

      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <p>{user?.username} ▼</p>

            <Button onClick={logout} variant="secondary">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button href="/auth/sign-up" variant="secondary">
              Sign Up
            </Button>
            <Button href="/auth/login">Login</Button>
          </>
        )}
      </div>
    </nav>
  );
}
