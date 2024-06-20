import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { UserModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [UserModule, SessionModule],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
