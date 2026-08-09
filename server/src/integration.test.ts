import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "./app.js";
import type { AppConfig } from "./config/env.js";
import { startLocalDatabase } from "./dev/local-database.js";
import { seedDatabase } from "./dev/seed.js";
import { createPrismaClient } from "./lib/prisma.js";

test("migrations, seed data, and public APIs work together", async () => {
  const local = await startLocalDatabase();
  const database = createPrismaClient(local.databaseUrl);
  const seed = await seedDatabase(database);
  const config: AppConfig = {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 3000,
    databaseUrl: local.databaseUrl,
    frontendOrigin: "http://127.0.0.1:5173",
  };
  const app = await buildApp({ config, database, logger: false });

  try {
    assert.deepEqual(seed, {
      courses: 3,
      lessons: 14,
      lessonItems: 5,
      videos: 1,
      subtitles: 350,
    });

    const courses = await app.inject({ method: "GET", url: "/api/v1/courses" });
    assert.equal(courses.statusCode, 200);
    assert.equal(courses.json().data.length, 3);
    assert.equal(courses.json().data[0].lesson_count, 5);

    const video = await app.inject({
      method: "GET",
      url: "/api/v1/videos/cha-chaan-teng",
    });
    assert.equal(video.statusCode, 200);
    assert.equal(video.json().data.subtitle_count, 350);

    const videoId = video.json().data.id as string;
    const subtitles = await app.inject({
      method: "GET",
      url: `/api/v1/videos/${videoId}/subtitles?limit=20`,
    });
    assert.equal(subtitles.statusCode, 200);
    assert.equal(subtitles.json().data.length, 20);
    assert.equal(subtitles.json().meta.has_more, true);
    assert.equal(typeof subtitles.json().meta.next_cursor, "string");
  } finally {
    await app.close();
    await local.close();
  }
});
