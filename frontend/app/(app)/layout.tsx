import type { Metadata } from "next";
import { ReactElement, ReactNode } from "react";
import Navbar from "./Navbar";

export const metadata: Metadata = {
  title: "Hibooks",
  description: "The most awesome place to be a night owl in a library !",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
