/**
 * ? It's not possible to call hooks in server components
 * ? But layout.tsx needs to be a server component as it exports the metadata
 * ? This is why we use this client component here as a wrapper
 */
"use client";

import { UserPrivate } from "backend";
import { ReactElement, ReactNode } from "react";
import { UserContext, useInitUserContext } from "../states/user";

export default function Providers({
  children,
  user,
}: {
  children: ReactNode;
  user: UserPrivate | null;
}): ReactElement {
  const initUserContext = useInitUserContext(user);

  return (
    <UserContext.Provider value={initUserContext}>
      {children}
    </UserContext.Provider>
  );
}
