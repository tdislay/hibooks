"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "../user/UserContext";

export function useRedirectIfAuthenticated(): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser();

  useEffect(() => {
    if (user.isAuthenticated) {
      router.push(searchParams.get("to") ?? "/");
    }
  }, [user, searchParams, router]);
}
