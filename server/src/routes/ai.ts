import type { FastifyInstance } from "fastify";

import { dataResponse } from "../lib/http.js";
import { AI_PROMPT_VERSION, type SubtitleExplainer } from "../services/deepseek.js";

type ExplainBody = {
  subtitle_id: string;
  text_simplified: string;
  text_traditional?: string;
  jyutping?: string;
  mandarin?: string;
  context?: string;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

export async function aiRoutes(app: FastifyInstance, explainer: SubtitleExplainer | null): Promise<void> {
  const cache = new Map<string, Awaited<ReturnType<SubtitleExplainer["explain"]>>>();
  const requestsByAddress = new Map<string, number[]>();

  app.post<{ Body: ExplainBody }>(
    "/ai/explain-subtitle",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["subtitle_id", "text_simplified"],
          properties: {
            subtitle_id: { type: "string", minLength: 1, maxLength: 100 },
            text_simplified: { type: "string", minLength: 1, maxLength: 300 },
            text_traditional: { type: "string", maxLength: 300 },
            jyutping: { type: "string", maxLength: 500 },
            mandarin: { type: "string", maxLength: 500 },
            context: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      if (!explainer) {
        return reply.code(503).send({ error: { code: "AI_NOT_CONFIGURED", message: "AI 讲解尚未配置", request_id: request.id } });
      }

      const now = Date.now();
      const recent = (requestsByAddress.get(request.ip) ?? []).filter((time) => now - time < WINDOW_MS);
      if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
        return reply.code(429).send({ error: { code: "AI_RATE_LIMITED", message: "请求太频繁，请稍后再试", request_id: request.id } });
      }
      recent.push(now);
      requestsByAddress.set(request.ip, recent);

      const cacheKey = `${request.body.subtitle_id}:${AI_PROMPT_VERSION}`;
      const cached = cache.get(cacheKey);
      if (cached) return dataResponse({ ...cached, cached: true, prompt_version: AI_PROMPT_VERSION }, request.id);

      try {
        const result = await explainer.explain({
          subtitleId: request.body.subtitle_id,
          textSimplified: request.body.text_simplified,
          textTraditional: request.body.text_traditional,
          jyutping: request.body.jyutping,
          mandarin: request.body.mandarin,
          context: request.body.context,
        });
        cache.set(cacheKey, result);
        return dataResponse({ ...result, cached: false, prompt_version: AI_PROMPT_VERSION }, request.id);
      } catch (error) {
        request.log.warn({ error }, "subtitle explanation failed");
        return reply.code(502).send({ error: { code: "AI_UPSTREAM_FAILED", message: "AI 讲解暂时不可用，请稍后重试", request_id: request.id } });
      }
    },
  );
}
