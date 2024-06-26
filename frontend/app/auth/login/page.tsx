"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactElement, useContext, useState } from "react";
import Button from "../../../components/ui/Button";
import AuthPanel from "../AuthPanel";
import { User, UserContext } from "@/api/user/UserContext";
import Checkbox from "@/components/forms/Checkbox";
import Form from "@/components/forms/Form";
import Input from "@/components/forms/Input";
import Callout from "@/components/ui/Callout";
import loginBanner from "@/public/auth/login-banner.jpg";
import googleSvg from "@/public/sso/google.svg";

export default function SignIn(): ReactElement {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorLogin, setErrorLogin] = useState(false);

  const router = useRouter();
  const userContext = useContext(UserContext);

  async function login(): Promise<void> {
    try {
      await userContext.login({ username, password, rememberMe });
      console.log("coucou");
      // router.push("/");
    } catch {
      console.log("error");
      setErrorLogin(true);
    }
  }

  return (
    <AuthPanel imageSrc={loginBanner}>
      <div className="flex flex-col space-y-6 h-full">
        <header>
          <h1 className="text-2xl font-bold">Login ✌️</h1>
          <p className="text-sm text-gray-500">
            Owlways happy to see you back!
          </p>
        </header>

        <Button variant="secondary" href="#COMMING_SOON">
          <>
            <Image src={googleSvg} alt="Google Icon" role="presentation" />
            <span>Continue with Google</span>
          </>
        </Button>

        <p className="flex items-center space-x-2 w-full text-gray-400 border-gray-400">
          <span className="flex-grow h-0 border-b"></span>
          <span className="text-center text-nowrap">or</span>
          <span className="flex-grow h-0 border-t"></span>
        </p>

        {errorLogin && (
          <Callout variant="error">
            The password or the username is incorrect. Please try again.
          </Callout>
        )}

        <Form>
          <Input
            value={username}
            onChange={setUsername}
            label="Username"
            placeholder="owliver"
          />
          <Input
            value={password}
            onChange={setPassword}
            label="Password"
            type="password"
            placeholder="**********"
          />

          <div className="flex justify-between">
            <Checkbox
              value={rememberMe}
              onChange={(checked) => setRememberMe(checked)}
              label="Remember me"
            />
            <Link href="/auth/forgot-password" className="text-gray-500">
              Forgot password?
            </Link>
          </div>
        </Form>

        <div className="flex flex-col flex-grow justify-between space-y-2 h-full">
          {/* On purpose empty div */}
          <div></div>
          <Button onClick={login}>Login</Button>
          <p className="block text-sm text-center text-gray-500">
            Hoo don't have an account yet?{" "}
            <Link href="/auth/sign-up" className="font-bold text-blue-600">
              Sign Up now!
            </Link>
          </p>
        </div>
      </div>
    </AuthPanel>
  );
}
