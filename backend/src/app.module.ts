import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configuration } from "./config";
import { PrismaModule } from "./infra/prisma";
import { RedisModule } from "./infra/redis";
import { SessionMiddleware } from "./infra/session/session.middleware";
import { SessionService } from "./infra/session/session.service";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/users/users.module";

@Module({
  providers: [SessionService],
  imports: [
    // Globals
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    PrismaModule,
    RedisModule,

    // Modules
    AuthModule,
    UserModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SessionMiddleware).forRoutes("*");
  }
}
