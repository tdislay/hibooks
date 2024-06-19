import { Module } from "@nestjs/common";
import { SessionMiddleware } from "./session.middleware";
import { SessionService } from "./session.service";

@Module({
  providers: [SessionService, SessionMiddleware],
  exports: [SessionService, SessionMiddleware],
})
export class SessionModule {}
