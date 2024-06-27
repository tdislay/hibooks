import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Request, Response } from "express";
import { z } from "zod";
import { UserPrivate } from "../users/types";
import { AuthService } from "./auth.service";
import { AuthenticatedGuard } from "./guards/Authenticated";
import { UnauthenticatedGuard } from "./guards/Unauthenticated";
import { Configuration } from "src/config";
import { ZodValidationPipe } from "src/infra/zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false).optional(),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const signInSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).trim(),
  password: z.string().min(7),
});
export type SignInDto = z.infer<typeof signInSchema>;

export const verifyAccountSchema = z.object({
  otp: z.string().regex(/[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "Malformed OTP"),
});
export type VerifyAccountDto = z.infer<typeof verifyAccountSchema>;

export type MeDto = undefined;

export type LogoutDto = undefined;

@Controller("auth")
export class AuthController {
  private sessionCookieName: string;
  private cookieOptions: Configuration["session"]["cookie"];

  constructor(
    private authService: AuthService,
    configService: ConfigService<Configuration, true>,
  ) {
    this.sessionCookieName = configService.get("session.cookieName", {
      infer: true,
    });
    this.cookieOptions = configService.get("session.cookie", { infer: true });
  }

  // **********************
  // Unauthenticated routes
  // **********************
  /**
   * Local authentification
   */
  @Post("login")
  @UseGuards(UnauthenticatedGuard)
  @UsePipes(new ZodValidationPipe(loginSchema))
  @HttpCode(200)
  async login(
    @Body() loginDto: Required<LoginDto>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserPrivate> {
    const { user, sessionToken } = await this.authService.login(
      loginDto.username,
      loginDto.password,
      loginDto.rememberMe,
    );

    if (user === null) {
      throw new HttpException("User not found", HttpStatus.UNAUTHORIZED);
    }

    if (sessionToken === null) {
      throw new HttpException("Wrong credentials", HttpStatus.UNAUTHORIZED);
    }

    response.cookie(this.sessionCookieName, sessionToken, {
      ...this.cookieOptions,
      maxAge: loginDto.rememberMe
        ? // ? express requires maxAge in milliseconds.
          // ? Against the RFC6265 (https://httpwg.org/specs/rfc6265.html#sane-max-age)
          // ? All of this misleading decisions, while in the end, it will be converted to seconds (https://github.com/expressjs/express/blob/master/lib/response.js#L884)
          this.cookieOptions.maxAge * 1000
        : // undefined = session-lived cookie
          undefined,
    });
    return user;
  }

  @Post("sign-up")
  @UseGuards(UnauthenticatedGuard)
  @UsePipes(new ZodValidationPipe(signInSchema))
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserPrivate> {
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
    @Req() request: Request,
  ): Promise<void> {
    const userId = (request.session as UserPrivate).id;
    const hasBeenVerified = await this.authService.verifyUserAccount(
      userId,
      body.otp,
    );

    if (!hasBeenVerified) {
      throw new NotFoundException();
    }
  }

  // ********************
  // Authenticated routes
  // ********************
  @Get("me")
  @UseGuards(AuthenticatedGuard)
  @HttpCode(200)
  async me(@Req() request: Request): Promise<UserPrivate> {
    return request.session as UserPrivate;
  }

  @Post("logout")
  @UseGuards(AuthenticatedGuard)
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sessionId = request.signedCookies[this.sessionCookieName] as string;
    await this.authService.logout(sessionId);

    response.clearCookie(this.sessionCookieName);
  }
}
