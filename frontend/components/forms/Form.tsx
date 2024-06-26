import { ReactElement, ReactNode } from "react";

export default function Form({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <form className="space-y-2">{children}</form>;
}
