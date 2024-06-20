import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserPasswordOmitted } from "../users/users.service";
import { isSignedTokenValid, secureIdGenerator, signHS256 } from "./utils";
import { Configuration } from "src/config";
import { EmailContent, EmailService } from "src/infra/email";
import { RedisService } from "src/infra/redis";

export const emailVerificationRedisPrefix = "email:verification";

const OTP_EXPIRATION_IN_SEC = 10 * 60; // 10 minutes

@Injectable()
export class EmailVerificationService {
  hs256Secret: string;

  constructor(
    private emailService: EmailService,
    private redisService: RedisService,
    private configService: ConfigService<Configuration, true>
  ) {
    this.hs256Secret = this.configService.get("application.hs256Secret", {
      infer: true,
    });
  }

  /**
   * The OTP identifier is made from a strong CSPRNG, then signed with HS256.
   * The OTP id/userId are stored in redis with a low ttl.
   * @param sessionId
   */
  async sendVerificationEmail(user: UserPasswordOmitted): Promise<void> {
    const frontendUrl = this.configService.get("frontend.url", { infer: true });

    const OneTimePasswordId = secureIdGenerator();
    await this.redisService.set(
      `${emailVerificationRedisPrefix}:${OneTimePasswordId}`,
      user.id,
      "EX",
      OTP_EXPIRATION_IN_SEC
    );

    const signedOTP = signHS256(OneTimePasswordId, this.hs256Secret);
    const verifyAccountLink = new URL(
      `/verify-account?otp=${signedOTP}`,
      frontendUrl
    );

    const emailContent = this.generateVerifyEmailContent(
      user.username,
      verifyAccountLink
    );
    await this.emailService.sendEmail(
      user.email,
      "Verify your account",
      emailContent
    );
  }

  async getUserIdFromOneTimePassword(
    signedOneTimePassword: string
  ): Promise<number | null> {
    const tokenValid = isSignedTokenValid(
      signedOneTimePassword,
      this.hs256Secret
    );
    if (!tokenValid) {
      return null;
    }

    const [oneTimePassword] = signedOneTimePassword.split(".");
    const userId = await this.redisService.get(
      `${emailVerificationRedisPrefix}:${oneTimePassword}`
    );

    // Avoiding `Number(null) = 0`
    if (userId === null) {
      return null;
    }

    await this.redisService.del(
      `${emailVerificationRedisPrefix}:${oneTimePassword}`
    );
    return Number(userId);
  }

  private generateVerifyEmailContent(
    username: string,
    verifyAccountLink: URL | string
  ): EmailContent {
    return {
      html: `<p>Hi ${username} ! Welcome on our platform !</p>
<p>To finish your account creation, we need to verify this account is yours.</p>
<p>Please click on this link: <a id="verify-account-link" href="${verifyAccountLink}">${verifyAccountLink}</a> to proceed.</p>
<p>If you did not create an account, please ignore this email</p>`,
      text: "Sorry, the mail can't be displayed",
    };
  }
}
