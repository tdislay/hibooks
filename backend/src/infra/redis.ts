import { Global, Injectable, Module, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { Configuration } from "src/config";

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(configService: ConfigService<Configuration, true>) {
    const password = configService.get("redis.password", { infer: true });
    super({ password });
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
