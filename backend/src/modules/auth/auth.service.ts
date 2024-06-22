import { Injectable } from "@nestjs/common";
import { compare } from "bcryptjs";
import { SessionService } from "../session/session.service";
import {
  CreateUserDto,
  UserPasswordOmitted,
  UsersService,
} from "../users/users.service";
import { EmailVerificationService } from "./emailVerification.service";
import { secureIdGenerator } from "./utils";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async login(
    username: string,
    password: string,
    rememberMe: boolean,
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
    const sessionToken = secureIdGenerator();
    await this.sessionService.set(sessionToken, user, rememberMe);

    return {
      user,
      sessionToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.destroy(sessionId);
  }

  async signIn(
    userDto: CreateUserDto,
  ): Promise<{ user: UserPasswordOmitted; sessionToken: string }> {
    const user = await this.usersService.create(userDto);

    await this.emailVerificationService.sendVerificationEmail(user);

    const sessionToken = secureIdGenerator();
    await this.sessionService.set(sessionToken, user, true); // Remember the user

    return { user, sessionToken };
  }

  async verifyUserAccount(
    userId: number,
    oneTimePassword: string,
  ): Promise<boolean> {
    const retrievedUserId =
      await this.emailVerificationService.getUserIdFromOneTimePassword(
        oneTimePassword,
      );

    if (userId !== retrievedUserId) {
      return false;
    }

    await this.usersService.verifyUserAccount(userId);
    return true;
  }
}
