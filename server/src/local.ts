import path from "node:path";

import { buildApp } from "./app.js";
import type { AppConfig } from "./config/env.js";
import { localDataDirectory, startLocalDatabase } from "./dev/local-database.js";
import { seedDatabase } from "./dev/seed.js";
import { createPrismaClient } from "./lib/prisma.js";

async function start(): Promise<void> {
  const localDatabase = await startLocalDatabase({
    dataDir: localDataDirectory(),
    port: 5433,
  });
  const database = createPrismaClient(localDatabase.databaseUrl);
  const seed = await seedDatabase(database);
  const config: AppConfig = {
    nodeEnv: "development",
    host: "127.0.0.1",
    port: 3000,
    databaseUrl: localDatabase.databaseUrl,
    frontendOrigin: "http://127.0.0.1:5173",
  };
  const app = await buildApp({ config, database });

  app.log.info(
    {
      database: path.relative(process.cwd(), localDataDirectory()),
      seed,
    },
    "local database ready",
  );

  const close = async (signal: string) => {
    app.log.info({ signal }, "shutting down local development stack");
    await app.close();
    await localDatabase.close();
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
