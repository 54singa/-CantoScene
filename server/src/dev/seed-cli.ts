import "dotenv/config";

import { loadConfig } from "../config/env.js";
import { createPrismaClient } from "../lib/prisma.js";
import { seedDatabase } from "./seed.js";

const config = loadConfig();
const database = createPrismaClient(config.databaseUrl);

try {
  const summary = await seedDatabase(database);
  console.log("Seed completed", summary);
} finally {
  await database.$disconnect();
}
