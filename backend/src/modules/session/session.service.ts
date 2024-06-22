import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../infra/redis";
import { SessionContent } from "./session";
import { Configuration } from "src/config";

// When remember me is false set the session ttl to 24h
const tempSessionExpirationInSeconds = 24 * 60 * 60;

@Injectable()
export class SessionService {
  private sessionPrefix: string;
  private sessionExpirationInSeconds: number;

  constructor(
    private redisService: RedisService,
    configService: ConfigService<Configuration, true>,
  ) {
    const sessionConfig = configService.get("session", { infer: true });

    this.sessionPrefix = sessionConfig.prefix;
    this.sessionExpirationInSeconds = sessionConfig.expirationInSeconds;
  }

  async set(
    sessionId: string,
    session: SessionContent,
    rememberMe: boolean,
  ): Promise<void> {
    await this.redisService.set(
      `${this.sessionPrefix}:${sessionId}`,
      JSON.stringify(session),
      "EX",
      rememberMe
        ? this.sessionExpirationInSeconds
        : tempSessionExpirationInSeconds,
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
