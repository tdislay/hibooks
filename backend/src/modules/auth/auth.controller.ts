import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
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
import { UserPrivate } from "../users/types";
import { AuthService } from "./auth.service";
import {
  loginSchema,
  signUpSchema,
  verifyAccountSchema,
} from "./auth.validators";
import { AuthenticatedGuard } from "./guards/Authenticated";
import { UnauthenticatedGuard } from "./guards/Unauthenticated";
import {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  SignUpRequest,
  SignUpResponse,
  VerifyAccountRequest,
  VerifyAccountResponse,
} from "./types";
import { Configuration } from "src/config";
import { ZodValidationPipe } from "src/infra/zod";

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
    @Body() body: Required<LoginRequest>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const { user, sessionId } = await this.authService.login(
      body.username,
      body.password,
      body.rememberMe,
    );

    if (user === null) {
      throw new HttpException("User not found", HttpStatus.UNAUTHORIZED);
    }

    if (sessionId === null) {
      throw new HttpException("Wrong credentials", HttpStatus.UNAUTHORIZED);
    }

    response.cookie(this.sessionCookieName, sessionId, {
      ...this.cookieOptions,
      maxAge: body.rememberMe
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
  @UsePipes(new ZodValidationPipe(signUpSchema))
  async signUp(
    @Body() body: SignUpRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignUpResponse> {
    try {
      const { user, sessionId } = await this.authService.signUp(body);

      response.cookie(this.sessionCookieName, sessionId, this.cookieOptions);

      return user;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const notUniqueField = (error.meta as { target: string[] } | undefined)
          ?.target[0];
        throw new ConflictException(`"${notUniqueField}" already exists`);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post("verification-email")
  @UseGuards(AuthenticatedGuard)
  @HttpCode(200)
  async sendVerificationEmail(@Req() request: Request): Promise<void> {
    const user = request.session as UserPrivate;
    if (user.verified) {
      throw new ForbiddenException();
    }

    await this.authService.sendVerificationEmail(user);
  }

  @Post("verify-account")
  @UseGuards(AuthenticatedGuard)
  @UsePipes(new ZodValidationPipe(verifyAccountSchema))
  @HttpCode(200)
  async verifyAccount(
    @Body() body: VerifyAccountRequest,
    @Req() request: Request,
  ): Promise<VerifyAccountResponse> {
    const hasBeenVerified = await this.authService.verifyUserAccount(
      request.session as UserPrivate,
      body.otp,
      request.sessionId as string,
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
  async me(@Req() request: Request): Promise<MeResponse> {
    return request.session as UserPrivate;
  }

  @Post("logout")
  @UseGuards(AuthenticatedGuard)
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    const sessionId = request.signedCookies[this.sessionCookieName] as string;
    await this.authService.logout(sessionId);

    response.clearCookie(this.sessionCookieName);
  }
}
