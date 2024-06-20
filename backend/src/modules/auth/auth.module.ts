import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { UserModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { EmailVerificationService } from "./emailVerification.service";
import { EmailModule } from "src/infra/email";

@Module({
  imports: [UserModule, EmailModule, SessionModule],
  controllers: [AuthController],
  providers: [AuthService, UsersService, EmailVerificationService],
})
export class AuthModule {}
