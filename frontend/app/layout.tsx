import type { Metadata } from "next";
import { ReactElement, ReactNode } from "react";
import Providers from "./Providers";
import "./globals.css";

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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
