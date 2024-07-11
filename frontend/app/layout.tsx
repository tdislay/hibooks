import type { Metadata } from "next";
import { ReactElement, ReactNode } from "react";
import Providers from "./Providers";
import { retrieveUserFromSessionIfAny } from "@/core/user";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hibooks",
  description: "The most awesome place to be a night owl in a library !",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  // As long as the layout remains a server component, it's safe to call this function.
  // This layout will remain a server component as it exports metadata, anyway.
  const user = await retrieveUserFromSessionIfAny();

  return (
    <html lang="en">
      <body>
        <Providers user={user}>{children}</Providers>
      </body>
    </html>
  );
}
