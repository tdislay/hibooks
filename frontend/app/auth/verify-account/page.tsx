"use client";

import { UserPrivate } from "backend";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useCallback, useEffect, useState } from "react";
import AuthPanel from "../AuthPanel";
import { useToast } from "@/components/toasts/useToast";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import { Spinner } from "@/components/ui/Spinner";
import { useRedirectIfUnauthenticated } from "@/core/guards/redirectIfUnauthenticated";
import verifyAccountBanner from "@/public/auth/verify-account-banner.jpg";
import { useUser } from "@/states/user";

export default function VerifyAccount(): ReactElement {
  const searchParams = useSearchParams();
  const otp = searchParams.get("otp");

  const [isLoading, setIsLoading] = useState(otp !== null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const router = useRouter();
  const user = useUser();
  const toast = useToast();
  useRedirectIfUnauthenticated();

  const verifyAccount = useCallback(async () => {
    const { error } = await user.verifyAccount(otp as string);

    if (error !== null) {
      setVerifyError(
        error.statusCode === 404
          ? "The OTP is invalid or has expired."
          : error.message,
      );
      return;
    }

    router.push("/");
  }, [user, otp, router]);

  useEffect(() => {
    if ((user.current as UserPrivate).verified) {
      router.push("/");
      return;
    }

    if (otp !== null) {
      setIsLoading(true);
      void verifyAccount();
      setIsLoading(false);
    }
  }, [otp, verifyAccount, router, user]);

  async function sendVerificationEmail(): Promise<void> {
    await user.sendVerificationEmail();

    toast.info("Verification email sent", "Check your inbox.");
  }

  if (otp === null) {
    return (
      <AuthPanel imageSrc={verifyAccountBanner}>
        <div className="flex flex-col space-y-6 h-full min-h-48 justify-between">
          <h1 className="text-2xl font-bold">Verifying account 🔎</h1>

          <p>We need to verify your email address.</p>

          <Button onClick={sendVerificationEmail}>
            Send verification email
          </Button>
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel imageSrc={verifyAccountBanner}>
      <div className="flex flex-col space-y-6 h-full">
        <h1 className="text-2xl font-bold">Verifying account 🔎</h1>

        {isLoading && (
          <div className="flex justify-center items-center w-full flex-grow">
            <Spinner />
          </div>
        )}

        {verifyError !== null && (
          <>
            <Callout variant="error">{verifyError}</Callout>
            <Button onClick={sendVerificationEmail}>Send another email</Button>
          </>
        )}
      </div>
    </AuthPanel>
  );
}
