import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import type { AppConfig } from "./config/env.js";
import type { DatabaseClient } from "./lib/prisma.js";
import { courseRoutes } from "./routes/courses.js";
import { healthRoutes } from "./routes/health.js";
import { videoRoutes } from "./routes/videos.js";

export type BuildAppOptions = {
  config: AppConfig;
  database: DatabaseClient;
  logger?: boolean;
};

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? options.config.nodeEnv !== "test",
    requestIdHeader: "x-request-id",
  });

  await app.register(cors, {
    origin: options.config.frontendOrigin,
    credentials: true,
  });

  app.setErrorHandler((error, request, reply) => {
    const httpError = error as {
      statusCode?: number;
      validation?: unknown;
    };
    request.log.error({ error }, "request failed");

    if (httpError.validation) {
      return reply.code(422).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "提交的数据不符合要求",
          details: httpError.validation,
          request_id: request.id,
        },
      });
    }

    return reply.code(httpError.statusCode ?? 500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "服务暂时不可用",
        request_id: request.id,
      },
    });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: {
        code: "NOT_FOUND",
        message: "接口不存在",
        request_id: request.id,
      },
    }),
  );

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await courseRoutes(api, options.database);
      await videoRoutes(api, options.database);
    },
    { prefix: "/api/v1" },
  );

  app.addHook("onClose", async () => {
    await options.database.$disconnect();
  });

  return app;
}
