"use client";

import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";
import AuthPanel from "../../AuthPanel";
import Button from "@/components/ui/Button";
import forgotPasswordEmailSentBanner from "@/public/auth/forgot-password-email-sent-banner.jpg";

export default function ForgotPasswordEmailSent(): ReactElement {
  const query = useSearchParams();
  const email = query.get("email");

  return (
    <AuthPanel imageSrc={forgotPasswordEmailSentBanner}>
      <div className="space-y-6 h-full">
        <div className="block text-8xl text-center">✉️</div>

        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Email sent</h1>
          <div className="space-y-1 text-sm text-gray-500">
            <p>
              Our best agent, is on its way, sending recover instructions to{" "}
              <span className="text-blue-600">{email}</span>.
            </p>
            <p>Depending on the wind, Mike can take up to 5 minutes.</p>
            <p>Check your spam folder.</p>
          </div>
        </header>

        <Button href="/auth/forgot-password">Resend</Button>
      </div>
    </AuthPanel>
  );
}
