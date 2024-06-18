import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Configuration } from "./config";
import { setupApp } from "./setup";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Configuration, true>);
  const port = configService.get("application.port", { infer: true });

  setupApp(app);
  await app.listen(port);
}

void bootstrap();
