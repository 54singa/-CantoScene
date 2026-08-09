import type { FastifyInstance } from "fastify";

import { dataResponse } from "../lib/http.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (request) =>
    dataResponse(
      {
        service: "canto-scene-api",
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      request.id,
    ),
  );
}
