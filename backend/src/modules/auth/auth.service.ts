import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { SessionService } from "../session/session.service";
import { CreateUserDto, UserPrivate } from "../users/types";
import { UsersService } from "../users/users.service";
import { EmailVerificationService } from "./emailVerification.service";

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
    user: UserPrivate | null;
    sessionId: string | null;
  }> {
    const user = await this.usersService.getByUsername(username, true);

    if (!user) {
      return { user: null, sessionId: null };
    }

    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      return { user, sessionId: null };
    }

    delete (user as { password?: string }).password;
    const sessionId = await this.sessionService.set(user, rememberMe);

    return {
      user,
      sessionId,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.destroy(sessionId);
  }

  async signUp(
    userDto: CreateUserDto,
  ): Promise<{ user: UserPrivate; sessionId: string }> {
    const password = await hash(userDto.password, 10);
    const user = await this.usersService.create({ ...userDto, password });

    const sessionId = await this.sessionService.set(user, true); // Remember the user

    return { user, sessionId };
  }

  async sendVerificationEmail(user: UserPrivate): Promise<void> {
    return this.emailVerificationService.sendVerificationEmail(user);
  }

  async verifyUserAccount(
    user: UserPrivate,
    oneTimePassword: string,
    sessionId: string,
  ): Promise<boolean> {
    const retrievedUserId =
      await this.emailVerificationService.getUserIdFromOneTimePassword(
        oneTimePassword,
      );

    if (user.id !== retrievedUserId) {
      return false;
    }

    await this.usersService.verifyUserAccount(user.id);
    await this.sessionService.update(sessionId, { ...user, verified: true });

    return true;
  }
}
