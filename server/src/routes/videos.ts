import type { FastifyInstance } from "fastify";

import {
  ContentReviewStatus,
  Difficulty,
  VideoStatus,
} from "../generated/prisma/enums.js";
import {
  dataResponse,
  decodeCursor,
  encodeCursor,
  enumValue,
  listResponse,
} from "../lib/http.js";
import type { DatabaseClient } from "../lib/prisma.js";

type VideoListQuery = {
  difficulty?: "starter" | "beginner" | "intermediate" | "advanced";
  limit?: number;
};

type VideoSlugParams = { videoSlug: string };
type VideoIdParams = { videoId: string };
type SubtitleQuery = {
  cursor?: string;
  limit?: number;
  from_ms?: number;
  to_ms?: number;
};

export async function videoRoutes(
  app: FastifyInstance,
  database: DatabaseClient,
): Promise<void> {
  app.get<{ Querystring: VideoListQuery }>(
    "/videos",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            difficulty: {
              type: "string",
              enum: ["starter", "beginner", "intermediate", "advanced"],
            },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
        },
      },
    },
    async (request) => {
      const videos = await database.video.findMany({
        where: {
          status: VideoStatus.PUBLISHED,
          ...(request.query.difficulty
            ? {
                difficulty:
                  Difficulty[
                    request.query.difficulty.toUpperCase() as keyof typeof Difficulty
                  ],
              }
            : {}),
        },
        orderBy: { publishedAt: "desc" },
        take: request.query.limit ?? 20,
        include: {
          _count: {
            select: {
              subtitleLines: {
                where: { reviewStatus: ContentReviewStatus.PUBLISHED },
              },
            },
          },
        },
      });

      return listResponse(
        videos.map((video) => ({
          id: video.id,
          slug: video.slug,
          title_simplified: video.listTitleSimplified,
          title_traditional: video.listTitleTraditional,
          summary_simplified: video.summarySimplified,
          summary_traditional: video.summaryTraditional,
          poster_url: video.posterUrl,
          duration_ms: video.durationMs,
          difficulty: enumValue(video.difficulty),
          tags: video.tags,
          subtitle_count: video._count.subtitleLines,
          progress: null,
        })),
        request.id,
        null,
      );
    },
  );

  app.get<{ Params: VideoSlugParams }>(
    "/videos/:videoSlug",
    async (request, reply) => {
      const video = await database.video.findFirst({
        where: {
          slug: request.params.videoSlug,
          status: VideoStatus.PUBLISHED,
        },
        include: {
          _count: {
            select: {
              subtitleLines: {
                where: { reviewStatus: ContentReviewStatus.PUBLISHED },
              },
            },
          },
        },
      });

      if (!video) {
        return reply.code(404).send({
          error: {
            code: "NOT_FOUND",
            message: "视频不存在",
            request_id: request.id,
          },
        });
      }

      return dataResponse(
        {
          id: video.id,
          slug: video.slug,
          title_simplified: video.titleSimplified,
          title_traditional: video.titleTraditional,
          summary_simplified: video.summarySimplified,
          summary_traditional: video.summaryTraditional,
          video_url: video.videoUrl,
          poster_url: video.posterUrl,
          duration_ms: video.durationMs,
          difficulty: enumValue(video.difficulty),
          tags: video.tags,
          focus_points: video.focusPoints,
          subtitle_count: video._count.subtitleLines,
          progress: null,
        },
        request.id,
      );
    },
  );

  app.get<{ Params: VideoIdParams; Querystring: SubtitleQuery }>(
    "/videos/:videoId/subtitles",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            cursor: { type: "string", minLength: 1 },
            limit: { type: "integer", minimum: 1, maximum: 500, default: 200 },
            from_ms: { type: "integer", minimum: 0 },
            to_ms: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const cursorPosition = decodeCursor(request.query.cursor);
      if (request.query.cursor && cursorPosition === undefined) {
        return reply.code(422).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "字幕游标无效",
            request_id: request.id,
          },
        });
      }

      const video = await database.video.findFirst({
        where: { id: request.params.videoId, status: VideoStatus.PUBLISHED },
        select: { id: true },
      });
      if (!video) {
        return reply.code(404).send({
          error: {
            code: "NOT_FOUND",
            message: "视频不存在",
            request_id: request.id,
          },
        });
      }

      const limit = request.query.limit ?? 200;
      const lines = await database.subtitleLine.findMany({
        where: {
          videoId: video.id,
          reviewStatus: ContentReviewStatus.PUBLISHED,
          ...(cursorPosition === undefined
            ? {}
            : { position: { gt: cursorPosition } }),
          ...(request.query.from_ms === undefined
            ? {}
            : { endMs: { gt: request.query.from_ms } }),
          ...(request.query.to_ms === undefined
            ? {}
            : { startMs: { lt: request.query.to_ms } }),
        },
        orderBy: { position: "asc" },
        take: limit + 1,
      });
      const hasMore = lines.length > limit;
      const page = hasMore ? lines.slice(0, limit) : lines;
      const lastLine = page.at(-1);

      return listResponse(
        page.map((line) => ({
          id: line.id,
          video_id: line.videoId,
          position: line.position,
          start_ms: line.startMs,
          end_ms: line.endMs,
          speaker: line.speaker,
          text_simplified: line.textSimplified,
          text_traditional: line.textTraditional,
          jyutping: line.jyutping,
          mandarin_simplified: line.mandarinSimplified,
          mandarin_traditional: line.mandarinTraditional,
          audio_url: line.audioUrl,
          is_favorited: false,
        })),
        request.id,
        hasMore && lastLine ? encodeCursor(lastLine.position) : null,
      );
    },
  );
}
