"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactElement, useState } from "react";
import AuthPanel from "../AuthPanel";
import Button from "@/components/ui/Button";
import Form from "@/components/forms/Form";
import Input from "@/components/forms/Input";
import signupBanner from "@/public/auth/signup-banner.jpg";
import googleSvg from "@/public/sso/google.svg";

export default function SignIn(): ReactElement {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function signup(): Promise<void> {
    console.log(email, username, password, confirmPassword);
  }

  return (
    <AuthPanel imageSrc={signupBanner}>
      <div className="flex flex-col space-y-6 h-full">
        <h1 className="text-2xl font-bold">Sign up 📋</h1>

        <Button variant="secondary" href="#COMMING_SOON">
          <>
            <Image src={googleSvg} alt="Google Icon" role="presentation" />
            <span>Sign up with Google</span>
          </>
        </Button>

        <p className="flex items-center space-x-2 w-full text-gray-400 border-gray-400">
          <span className="flex-grow h-0 border-b"></span>
          <span className="text-center text-nowrap">or</span>
          <span className="flex-grow h-0 border-t"></span>
        </p>

        <Form>
          <Input
            value={email}
            onChange={setEmail}
            label="Email"
            type="email"
            placeholder="owliver.hootkins@hibooks.xyz"
          />
          <Input
            value={username}
            onChange={setUsername}
            label="Username"
            placeholder="owliver123"
          />
          <Input
            value={password}
            onChange={setPassword}
            label="Password"
            type="password"
            placeholder="********"
          />
          <Input
            value={confirmPassword}
            onChange={setConfirmPassword}
            label="Confirm password"
            type="password"
            placeholder="********"
          />
        </Form>

        <div className="flex flex-col flex-grow justify-between space-y-2 h-full">
          {/* On purpose empty div */}
          <div></div>
          <Button onClick={signup}>Create account</Button>
          <p className="block text-sm text-center text-gray-500">
            Owlready have an account?{" "}
            <Link href="/auth/login" className="font-bold text-blue-600">
              Log in!
            </Link>
          </p>
        </div>
      </div>
    </AuthPanel>
  );
}
