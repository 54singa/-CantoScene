import "dotenv/config";

import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createPrismaClient } from "./lib/prisma.js";

async function start(): Promise<void> {
  const config = loadConfig();
  const database = createPrismaClient(config.databaseUrl);
  const app = await buildApp({ config, database });

  const close = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", () => void close("SIGINT"));
  process.once("SIGTERM", () => void close("SIGTERM"));

  await app.listen({ host: config.host, port: config.port });
}

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
