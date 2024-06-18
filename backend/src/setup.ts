import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import "dotenv/config";
import { Configuration } from "./config";

export function setupApp<A>(app: INestApplication<A>): void {
  const configService = app.get(ConfigService<Configuration, true>);
  const cookieSecret = configService.get("application.cookieSecret", {
    infer: true,
  });

  // Express plugins
  app.use(cookieParser(cookieSecret));
}
