/**
 * ? It's not possible to call hooks in server components
 * ? But layout.tsx needs to be a server component as it exports the metadata
 * ? This is why we use this client component here as wrapper
 */
"use client";

import { ReactElement, ReactNode } from "react";
import { UserContext, useUserContext } from "@/api/user/UserContext";

export default function Providers({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const userContext = useUserContext();

  // useEffect(() => {
  //   await get
  // }, []);

  return (
    <UserContext.Provider value={userContext}>{children}</UserContext.Provider>
  );
}
