import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "./app.js";
import type { AppConfig } from "./config/env.js";
import type { DatabaseClient } from "./lib/prisma.js";
import type { SubtitleExplainer } from "./services/deepseek.js";

const config: AppConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 3000,
  databaseUrl: "postgresql://unused:unused@127.0.0.1:5432/unused",
  frontendOrigin: "http://127.0.0.1:5173",
  jwtAccessSecret: "canto-scene-test-access-secret-00000000",
};

const database = {
  $disconnect: async () => undefined,
} as unknown as DatabaseClient;

test("GET /api/v1/health returns the API envelope", async () => {
  const app = await buildApp({ config, database, logger: false });
  const response = await app.inject({ method: "GET", url: "/api/v1/health" });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.data.service, "canto-scene-api");
  assert.equal(body.data.status, "ok");
  assert.equal(typeof body.meta.request_id, "string");

  await app.close();
});

test("unknown routes use the stable error envelope", async () => {
  const app = await buildApp({ config, database, logger: false });
  const response = await app.inject({ method: "GET", url: "/api/v1/missing" });

  assert.equal(response.statusCode, 404);
  const body = response.json();
  assert.equal(body.error.code, "NOT_FOUND");
  assert.equal(typeof body.error.request_id, "string");

  await app.close();
});

test("GET /api/v1/courses maps published course data to the public contract", async () => {
  const courseDatabase = {
    course: {
      findMany: async () => [
        {
          id: "5f1d9987-6aa3-4bbd-b784-2161248f2910",
          slug: "cha-chaan-teng-starter",
          titleSimplified: "茶餐厅点餐",
          titleTraditional: "茶餐廳點餐",
          summarySimplified: "从真实点餐场景开始学习。",
          summaryTraditional: "從真實點餐場景開始學習。",
          coverUrl: "/images/courses/cha-chaan-teng.webp",
          difficulty: "STARTER",
          estimatedMinutes: 35,
          _count: { lessons: 5 },
        },
      ],
    },
    $disconnect: async () => undefined,
  } as unknown as DatabaseClient;
  const app = await buildApp({ config, database: courseDatabase, logger: false });
  const response = await app.inject({ method: "GET", url: "/api/v1/courses" });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.data[0].slug, "cha-chaan-teng-starter");
  assert.equal(body.data[0].difficulty, "starter");
  assert.equal(body.data[0].lesson_count, 5);
  assert.equal(body.data[0].progress, null);

  await app.close();
});

test("subtitle endpoint rejects an invalid cursor before querying the database", async () => {
  const app = await buildApp({ config, database, logger: false });
  const response = await app.inject({
    method: "GET",
    url: "/api/v1/videos/5f1d9987-6aa3-4bbd-b784-2161248f2910/subtitles?cursor=invalid",
  });

  assert.equal(response.statusCode, 422);
  assert.equal(response.json().error.code, "VALIDATION_ERROR");

  await app.close();
});

test("subtitle explanation validates input and caches successful AI output", async () => {
  let calls = 0;
  const aiExplainer: SubtitleExplainer = {
    async explain() {
      calls += 1;
      return {
        meaning: "在当前场景中表示礼貌地提出请求。",
        learning_points: ["“唔该”常用于接受服务或麻烦别人。"],
        usage_note: "语气自然礼貌，适合点餐。",
        similar_expression: "唔该，畀杯冻柠茶我。",
      };
    },
  };
  const app = await buildApp({ config, database, logger: false, aiExplainer });
  const body = {
    subtitle_id: "line-1",
    text_simplified: "唔该，我想要杯冻柠茶。",
  };

  const first = await app.inject({ method: "POST", url: "/api/v1/ai/explain-subtitle", payload: body });
  const second = await app.inject({ method: "POST", url: "/api/v1/ai/explain-subtitle", payload: body });
  assert.equal(first.statusCode, 200);
  assert.equal(first.json().data.cached, false);
  assert.equal(second.json().data.cached, true);
  assert.equal(calls, 1);

  const invalid = await app.inject({ method: "POST", url: "/api/v1/ai/explain-subtitle", payload: { subtitle_id: "line-2", text_simplified: "" } });
  assert.equal(invalid.statusCode, 422);
  await app.close();
});

test("subtitle explanation reports missing server-side AI configuration", async () => {
  const app = await buildApp({ config, database, logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/ai/explain-subtitle",
    payload: { subtitle_id: "line-1", text_simplified: "唔该。" },
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().error.code, "AI_NOT_CONFIGURED");
  await app.close();
});
