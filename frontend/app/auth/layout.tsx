import { ReactElement, ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <div className="flex justify-center items-center w-screen h-screen bg-blue-100">
      {children}
    </div>
  );
}
