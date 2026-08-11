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
    jwtAccessSecret: "canto-scene-test-access-secret-00000000",
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

    const restaurant = await app.inject({
      method: "GET",
      url: "/api/v1/courses/restaurant",
    });
    assert.equal(restaurant.statusCode, 200);
    assert.equal(restaurant.json().data.lessons[1].title_simplified, "说出你想要什么");
    const showcaseLessonId = restaurant.json().data.lessons[1].id as string;
    const showcaseLesson = await app.inject({
      method: "GET",
      url: `/api/v1/lessons/${showcaseLessonId}`,
    });
    assert.equal(showcaseLesson.statusCode, 200);
    assert.equal(showcaseLesson.json().data.items.length, 5);
    assert.equal(showcaseLesson.json().data.items[0].content.source_id, "dialogue-order-drink-1");
    assert.equal(showcaseLesson.json().data.items[0].audio_url, "/audio/dialogue/order-drink-01.mp3");

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

    const registration = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "learner@example.com",
        password: "correct-horse-2026",
        display_name: "测试学习者",
      },
    });
    assert.equal(registration.statusCode, 201);
    const accessToken = registration.json().data.access_token as string;
    assert.equal(typeof accessToken, "string");
    assert.equal(registration.json().data.user.script_preference, "simplified");

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().data.display_name, "测试学习者");

    const preference = await app.inject({
      method: "PATCH",
      url: "/api/v1/me/preferences",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { script_preference: "traditional" },
    });
    assert.equal(preference.statusCode, 200);
    assert.equal(preference.json().data.script_preference, "traditional");

    const cookie = registration.headers["set-cookie"]?.split(";")[0];
    assert.ok(cookie);
    const refreshed = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie },
    });
    assert.equal(refreshed.statusCode, 200);
    assert.equal(typeof refreshed.json().data.access_token, "string");

    const duplicate = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "LEARNER@example.com",
        password: "another-password-2026",
      },
    });
    assert.equal(duplicate.statusCode, 409);

    const firstSubtitleId = subtitles.json().data[0].id as string;
    const favorite = await app.inject({
      method: "PUT",
      url: `/api/v1/me/favorites/subtitles/${firstSubtitleId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    assert.equal(favorite.statusCode, 200);
    assert.equal(favorite.json().data.kind, "subtitle_line");

    const word = await app.inject({
      method: "POST",
      url: "/api/v1/me/wordbook",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        term_simplified: "唔该",
        term_traditional: "唔該",
        jyutping: "m4 goi1",
        mandarin_simplified: "谢谢；麻烦你",
        source_type: "subtitle_line",
        source_id: firstSubtitleId,
      },
    });
    assert.equal(word.statusCode, 201);

    const progress = await app.inject({
      method: "PUT",
      url: `/api/v1/me/video-progress/${videoId}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { status: "in_progress", current_ms: 38000 },
    });
    assert.equal(progress.statusCode, 200);
    assert.equal(progress.json().data.current_ms, 38000);

    const summary = await app.inject({
      method: "GET",
      url: "/api/v1/me/learning-summary",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    assert.equal(summary.statusCode, 200);
    assert.equal(summary.json().data.videos_started, 1);
    assert.equal(summary.json().data.wordbook_learning, 1);

    const secondRegistration = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "second@example.com", password: "second-user-2026" },
    });
    const secondToken = secondRegistration.json().data.access_token as string;
    const secondFavorites = await app.inject({
      method: "GET",
      url: "/api/v1/me/favorites",
      headers: { authorization: `Bearer ${secondToken}` },
    });
    assert.equal(secondFavorites.statusCode, 200);
    assert.equal(secondFavorites.json().data.length, 0);

    const crossUserDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/me/favorites/${favorite.json().data.id as string}`,
      headers: { authorization: `Bearer ${secondToken}` },
    });
    assert.equal(crossUserDelete.statusCode, 404);

    const anonymousFavorites = await app.inject({
      method: "GET",
      url: "/api/v1/me/favorites",
    });
    assert.equal(anonymousFavorites.statusCode, 401);
  } finally {
    await app.close();
    await local.close();
  }
});
