import { Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, Response } from "express";
import { SessionService } from "./session.service";
import { Configuration } from "src/config";

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private sessionCookieName: string;

  constructor(
    private sessionService: SessionService,
    configService: ConfigService<Configuration, true>,
  ) {
    this.sessionCookieName = configService.get("session.cookieName", {
      infer: true,
    });
  }

  async use(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    request.session = null;
    request.sessionId = null;

    const sessionId: string | undefined =
      request.signedCookies[this.sessionCookieName];
    if (sessionId == null) {
      next();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const session = await this.sessionService.get(sessionId!);
    if (session === null) {
      response.clearCookie(this.sessionCookieName);
      next();
      return;
    }

    request.sessionId = sessionId;
    request.session = session;
    next();
  }
}
