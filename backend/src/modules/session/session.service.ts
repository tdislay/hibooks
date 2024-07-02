import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../infra/redis";
import { secureIdGenerator } from "../auth/utils";
import { SessionContent } from "./types";
import { Configuration } from "src/config";

@Injectable()
export class SessionService {
  private sessionPrefix: string;
  private sessionExpirationInSeconds: number;
  private tempSessionExpirationInSeconds: number;

  constructor(
    private redisService: RedisService,
    configService: ConfigService<Configuration, true>,
  ) {
    const sessionConfig = configService.get("session", { infer: true });

    this.sessionPrefix = sessionConfig.prefix;
    this.sessionExpirationInSeconds = sessionConfig.expirationInSeconds;
    this.tempSessionExpirationInSeconds = sessionConfig.tempExpirationInSeconds;
  }

  async set(session: SessionContent, rememberMe: boolean): Promise<string> {
    const sessionId = secureIdGenerator();

    const sessionExpiration = rememberMe
      ? this.sessionExpirationInSeconds
      : this.tempSessionExpirationInSeconds;

    await this.redisService.set(
      `${this.sessionPrefix}:${sessionId}`,
      JSON.stringify(session),
      "EX",
      sessionExpiration,
    );

    await this.redisService.sadd(
      `${this.sessionPrefix}:${session.id}`,
      sessionId,
    );

    return sessionId;
  }

  async update(
    sessionId: string,
    sessionUpdated: SessionContent,
  ): Promise<void> {
    await this.redisService.set(
      `${this.sessionPrefix}:${sessionId}`,
      JSON.stringify(sessionUpdated),
      "KEEPTTL",
    );
  }

  async get(key: string): Promise<SessionContent | null> {
    const stringSessionContent = await this.redisService.get(
      `${this.sessionPrefix}:${key}`,
    );

    if (stringSessionContent === null) {
      return null;
    }

    return JSON.parse(stringSessionContent) as SessionContent;
  }

  async destroy(key: string): Promise<void> {
    await this.redisService.del(`${this.sessionPrefix}:${key}`);
  }
}
