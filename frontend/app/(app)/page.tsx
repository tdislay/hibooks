"use client";

import { ReactElement, useContext } from "react";
import { UserContext } from "@/core/user/UserContext";

export default function Home(): ReactElement {
  const { current } = useContext(UserContext);

  return (
    <>
      <h1>
        Hello {current?.username}.
        {current?.verified === false && " YOU ARE NOT VERIFIED YET"}
      </h1>
    </>
  );
}
