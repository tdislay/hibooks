import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UsePipes,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CookieOptions, Request, Response } from "express";
import { z } from "zod";
import { UserPasswordOmitted } from "../users/users.service";
import { AuthService } from "./auth.service";
import { Configuration } from "src/config";
import { ZodValidationPipe } from "src/infra/zod";

export type LoginDto = z.infer<typeof loginSchema>;

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
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
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    const sessionId = request.signedCookies[this.sessionCookieName] as string;
    await this.authService.logout(sessionId);

    response.clearCookie(this.sessionCookieName);
  }
}
