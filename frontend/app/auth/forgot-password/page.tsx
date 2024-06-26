"use client";

import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";
import AuthPanel from "../AuthPanel";
import Button from "@/components/ui/Button";
import Input from "@/components/forms/Input";
import forgotPasswordBanner from "@/public/auth/forgot-password-banner.jpg";

export default function ForgotPassword(): ReactElement {
  const [email, setEmail] = useState("");
  const router = useRouter();

  async function sendResetPasswordMail(): Promise<void> {
    console.log(email);
    // Validate email

    router.push(`/auth/forgot-password/sent?email=${email}`);
  }

  return (
    <AuthPanel imageSrc={forgotPasswordBanner}>
      <div className="flex flex-col space-y-6 h-full">
        <header>
          <h1 className="text-2xl font-bold">Forgot Password?️</h1>
          <p className="text-sm text-gray-500">
            No worries.
            <br />
            We will send Mike Cooper our mail pigeon!
          </p>
        </header>

        <Input
          value={email}
          onChange={setEmail}
          label="Email"
          type="email"
          placeholder="owliver.hootkins@hibooks.xyz"
        />

        <div className="flex space-x-2">
          <Button href="/auth/login" variant="secondary">
            Cancel
          </Button>
          <Button onClick={sendResetPasswordMail}>Send</Button>
        </div>
      </div>
    </AuthPanel>
  );
}
