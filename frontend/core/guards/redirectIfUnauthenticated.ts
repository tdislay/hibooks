"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "../../states/user";

export function useRedirectIfUnauthenticated(): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useUser();

  useEffect(() => {
    if (!user.isAuthenticated) {
      router.push(
        `/auth/login?to=${pathname}${encodeURIComponent("?")}${searchParams}`,
      );
    }
  }, [router, pathname, searchParams, user]);
}
