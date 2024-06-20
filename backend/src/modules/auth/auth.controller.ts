import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { CookieOptions, Request, Response } from "express";
import { z } from "zod";
import { UserPasswordOmitted } from "../users/users.service";
import { AuthService } from "./auth.service";
import { AuthenticatedGuard } from "./guards/Authenticated";
import { UnauthenticatedGuard } from "./guards/Unauthenticated";
import { Configuration } from "src/config";
import { ZodValidationPipe } from "src/infra/zod";

export type LoginDto = z.infer<typeof loginSchema>;
export type SignInDto = z.infer<typeof signInSchema>;
export type VerifyAccountDto = z.infer<typeof verifyAccountSchema>;

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const signInSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).trim(),
  password: z.string().min(7),
});

const verifyAccountSchema = z.object({
  otp: z.string().regex(/[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "Malformed OTP"),
});

@Controller("auth")
export class AuthController {
  private sessionCookieName: string;
  private cookieOptions: CookieOptions;

  constructor(
    private authService: AuthService,
    configService: ConfigService<Configuration, true>
  ) {
    this.sessionCookieName = configService.get("session.cookieName", {
      infer: true,
    });
    this.cookieOptions = configService.get("session.cookie", { infer: true });
  }

  /**
   * Local authentification
   */
  @Post("login")
  @UseGuards(UnauthenticatedGuard)
  @UsePipes(new ZodValidationPipe(loginSchema))
  @HttpCode(200)
  async login(
    @Body() credentials: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<UserPasswordOmitted> {
    const { user, sessionToken } = await this.authService.login(
      credentials.username,
      credentials.password
    );

    if (user === null) {
      throw new HttpException("User not found", HttpStatus.UNAUTHORIZED);
    }

    if (sessionToken === null) {
      throw new HttpException("Wrong credentials", HttpStatus.UNAUTHORIZED);
    }

    response.cookie(this.sessionCookieName, sessionToken, this.cookieOptions);
    return user;
  }

  @Post("logout")
  @UseGuards(AuthenticatedGuard)
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    const sessionId = request.signedCookies[this.sessionCookieName] as string;
    await this.authService.logout(sessionId);

    response.clearCookie(this.sessionCookieName);
  }

  @Post("sign-in")
  @UseGuards(UnauthenticatedGuard)
  @UsePipes(new ZodValidationPipe(signInSchema))
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<UserPasswordOmitted> {
    try {
      const { user, sessionToken } = await this.authService.signIn(signInDto);

      response.cookie(this.sessionCookieName, sessionToken, this.cookieOptions);

      return user;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const notUniqueField = (error.meta as { target: string[] } | undefined)
          ?.target[0];
        throw new ConflictException(`"${notUniqueField}" is not unique`);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post("verify-account")
  @UseGuards(AuthenticatedGuard)
  @UsePipes(new ZodValidationPipe(verifyAccountSchema))
  @HttpCode(200)
  async verifyAccount(
    @Body() body: VerifyAccountDto,
    @Req() request: Request
  ): Promise<void> {
    const userId = (request.session as UserPasswordOmitted).id;
    const hasBeenVerified = await this.authService.verifyUserAccount(
      userId,
      body.otp
    );

    if (!hasBeenVerified) {
      throw new NotFoundException();
    }
  }

  // In an entreprise context, a regenerate "VerifyAccountOTP" route should be added
}
