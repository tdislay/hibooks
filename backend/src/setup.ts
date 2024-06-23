import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import "dotenv/config";
import { Configuration } from "./config";

export function setupApp<A>(app: INestApplication<A>): void {
  const configService = app.get(ConfigService<Configuration, true>);
  const cors = configService.get("application.cors", { infer: true });
  const cookieSecret = configService.get("application.hs256Secret", {
    infer: true,
  });

  // Plugins
  app.enableCors(cors);
  app.use(cookieParser(cookieSecret));
}
