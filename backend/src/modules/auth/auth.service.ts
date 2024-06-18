import { randomBytes } from "crypto";
import { Injectable } from "@nestjs/common";
import { compare } from "bcryptjs";
import { UserPasswordOmitted, UsersService } from "../users/users.service";
import { SessionService } from "src/infra/session/session.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService
  ) {}

  async login(
    username: string,
    password: string
  ): Promise<{
    user: UserPasswordOmitted | null;
    sessionToken: string | null;
  }> {
    const user = await this.usersService.getByUsername(username, true);

    if (!user) {
      return { user: null, sessionToken: null };
    }

    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      return { user, sessionToken: null };
    }

    delete (user as { password?: string }).password;
    const sessionToken = this.idGenerator();
    await this.sessionService.set(sessionToken, user);

    return {
      user,
      sessionToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.destroy(sessionId);
  }

  /**
   * 24 bytes / 192 bits of entropy encoded in base64 (256 bits string / 32 characters)
   * Use base64url for url safety
   */
  private idGenerator(): string {
    return randomBytes(24).toString("base64url");
  }
}
