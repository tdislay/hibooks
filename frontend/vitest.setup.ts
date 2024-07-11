import { loadEnvConfig } from "@next/env";

export default function setup(): void {
  loadEnvConfig(process.cwd());
}
