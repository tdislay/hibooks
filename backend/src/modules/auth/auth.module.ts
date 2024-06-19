import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { UserModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { AuthController } from "./auth.controller";
import { needAuthenticated, needUnauthenticated } from "./auth.middleware";
import { AuthService } from "./auth.service";

@Module({
  imports: [UserModule, SessionModule],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(needUnauthenticated)
      .forRoutes("/auth/login")
      .apply(needAuthenticated)
      .forRoutes("/auth/logout");
  }
}
