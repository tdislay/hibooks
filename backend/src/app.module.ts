import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configuration } from "./config";
import { PrismaModule } from "./infra/prisma";
import { RedisModule } from "./infra/redis";
import { AuthModule } from "./modules/auth/auth.module";
import { SessionMiddleware } from "./modules/session/session.middleware";
import { SessionModule } from "./modules/session/session.module";
import { UserModule } from "./modules/users/users.module";

@Module({
  imports: [
    // Globals
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,

    // Modules
    AuthModule,
    SessionModule,
    UserModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SessionMiddleware).forRoutes("*");
  }
}
