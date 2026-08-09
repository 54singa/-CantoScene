import { createHash } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const migrationsDirectory = fileURLToPath(
  new URL("../../prisma/migrations/", import.meta.url),
);

export type LocalDatabase = {
  db: PGlite;
  socket: PGLiteSocketServer;
  databaseUrl: string;
  close: () => Promise<void>;
};

async function applyLocalMigrations(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS "_canto_local_migrations" (
      "name" TEXT PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const migrationNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of migrationNames) {
    const sql = await readFile(
      path.join(migrationsDirectory, name, "migration.sql"),
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await db.query<{ checksum: string }>(
      'SELECT "checksum" FROM "_canto_local_migrations" WHERE "name" = $1',
      [name],
    );

    if (existing.rows[0]) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(
          `Local migration ${name} changed after it was applied; reset server/.data/pglite`,
        );
      }
      continue;
    }

    await db.transaction(async (transaction) => {
      await transaction.exec(sql);
      await transaction.query(
        'INSERT INTO "_canto_local_migrations" ("name", "checksum") VALUES ($1, $2)',
        [name, checksum],
      );
    });
  }
}

export async function startLocalDatabase(options?: {
  dataDir?: string;
  port?: number;
}): Promise<LocalDatabase> {
  const dataDir = options?.dataDir ?? "memory://";
  if (dataDir !== "memory://" && !dataDir.includes("://")) {
    await mkdir(dataDir, { recursive: true });
  }
  const db = await PGlite.create(dataDir);
  await applyLocalMigrations(db);

  const socket = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port: options?.port ?? 0,
    maxConnections: 10,
  });
  await socket.start();

  const connection = socket.getServerConn();
  const databaseUrl = `postgresql://postgres:postgres@${connection}/postgres?sslmode=disable`;

  return {
    db,
    socket,
    databaseUrl,
    close: async () => {
      await socket.stop();
      await db.close();
    },
  };
}

export function localDataDirectory(): string {
  const serverRoot = fileURLToPath(new URL("../../", import.meta.url));
  return path.join(serverRoot, ".data", "pglite");
}
