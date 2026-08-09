import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import {
  LearningStatus,
  ProgressStatus,
  PublishStatus,
  VideoStatus,
} from "../generated/prisma/enums.js";
import { dataResponse, enumValue, listResponse } from "../lib/http.js";
import type { DatabaseClient } from "../lib/prisma.js";
import { requireUser } from "./auth.js";

type IdParams = { id: string };
type SubtitleParams = { subtitleLineId: string };
type LessonItemParams = { lessonItemId: string };
type LessonParams = { lessonId: string };
type VideoParams = { videoId: string };
type StatusBody = { status?: "saved" | "learning" | "mastered" | "archived"; note?: string | null };

const statusMap = {
  saved: LearningStatus.SAVED,
  learning: LearningStatus.LEARNING,
  mastered: LearningStatus.MASTERED,
  archived: LearningStatus.ARCHIVED,
} as const;

function notFound(request: FastifyRequest, reply: FastifyReply, message: string) {
  return reply.code(404).send({ error: { code: "NOT_FOUND", message, request_id: request.id } });
}

function favoriteView(favorite: {
  id: string;
  learningStatus: string;
  note: string | null;
  createdAt: Date;
  subtitleLine: null | {
    id: string;
    videoId: string;
    position: number;
    startMs: number;
    endMs: number;
    textSimplified: string;
    textTraditional: string;
    jyutping: string | null;
    mandarinSimplified: string | null;
    mandarinTraditional: string | null;
    video: { slug: string };
  };
  lessonItem: null | { id: string; content: unknown };
}) {
  return {
    id: favorite.id,
    kind: favorite.subtitleLine ? "subtitle_line" : "lesson_item",
    status: enumValue(favorite.learningStatus),
    note: favorite.note,
    created_at: favorite.createdAt.toISOString(),
    subtitle_line: favorite.subtitleLine
      ? {
          id: favorite.subtitleLine.id,
          video_id: favorite.subtitleLine.videoId,
          video_slug: favorite.subtitleLine.video.slug,
          position: favorite.subtitleLine.position,
          start_ms: favorite.subtitleLine.startMs,
          end_ms: favorite.subtitleLine.endMs,
          text_simplified: favorite.subtitleLine.textSimplified,
          text_traditional: favorite.subtitleLine.textTraditional,
          jyutping: favorite.subtitleLine.jyutping,
          mandarin_simplified: favorite.subtitleLine.mandarinSimplified,
          mandarin_traditional: favorite.subtitleLine.mandarinTraditional,
        }
      : null,
    lesson_item: favorite.lessonItem,
  };
}

const favoriteInclude = {
  subtitleLine: { include: { video: { select: { slug: true } } } },
  lessonItem: { select: { id: true, content: true } },
} as const;

export async function learningDataRoutes(
  app: FastifyInstance,
  database: DatabaseClient,
): Promise<void> {
  app.addHook("preHandler", requireUser);

  app.get<{ Querystring: { kind?: string; status?: keyof typeof statusMap; limit?: number } }>(
    "/me/favorites",
    async (request) => {
      const favorites = await database.favorite.findMany({
        where: {
          userId: request.user.sub,
          ...(request.query.kind === "subtitle_line" ? { subtitleLineId: { not: null } } : {}),
          ...(request.query.kind === "lesson_item" ? { lessonItemId: { not: null } } : {}),
          ...(request.query.status ? { learningStatus: statusMap[request.query.status] } : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: Math.min(request.query.limit ?? 20, 50),
        include: favoriteInclude,
      });
      return listResponse(favorites.map(favoriteView), request.id, null);
    },
  );

  app.put<{ Params: SubtitleParams }>(
    "/me/favorites/subtitles/:subtitleLineId",
    async (request, reply) => {
      const line = await database.subtitleLine.findUnique({ where: { id: request.params.subtitleLineId } });
      if (!line) return notFound(request, reply, "字幕不存在");
      const favorite = await database.favorite.upsert({
        where: { userId_subtitleLineId: { userId: request.user.sub, subtitleLineId: line.id } },
        update: {},
        create: { userId: request.user.sub, subtitleLineId: line.id },
        include: favoriteInclude,
      });
      return dataResponse(favoriteView(favorite), request.id);
    },
  );

  app.put<{ Params: LessonItemParams }>(
    "/me/favorites/lesson-items/:lessonItemId",
    async (request, reply) => {
      const item = await database.lessonItem.findUnique({ where: { id: request.params.lessonItemId } });
      if (!item) return notFound(request, reply, "课程内容不存在");
      const favorite = await database.favorite.upsert({
        where: { userId_lessonItemId: { userId: request.user.sub, lessonItemId: item.id } },
        update: {},
        create: { userId: request.user.sub, lessonItemId: item.id },
        include: favoriteInclude,
      });
      return dataResponse(favoriteView(favorite), request.id);
    },
  );

  app.patch<{ Params: IdParams; Body: StatusBody }>("/me/favorites/:id", async (request, reply) => {
    const existing = await database.favorite.findFirst({ where: { id: request.params.id, userId: request.user.sub } });
    if (!existing) return notFound(request, reply, "收藏不存在");
    const favorite = await database.favorite.update({
      where: { id: existing.id },
      data: {
        ...(request.body.status ? { learningStatus: statusMap[request.body.status] } : {}),
        ...(request.body.note !== undefined ? { note: request.body.note } : {}),
      },
      include: favoriteInclude,
    });
    return dataResponse(favoriteView(favorite), request.id);
  });

  app.delete<{ Params: IdParams }>("/me/favorites/:id", async (request, reply) => {
    const result = await database.favorite.deleteMany({ where: { id: request.params.id, userId: request.user.sub } });
    if (!result.count) return notFound(request, reply, "收藏不存在");
    return reply.code(204).send();
  });

  app.get("/me/wordbook", async (request) => {
    const items = await database.wordbookItem.findMany({
      where: { userId: request.user.sub },
      orderBy: { updatedAt: "desc" },
    });
    return listResponse(items.map((item) => ({
      id: item.id,
      term_simplified: item.termSimplified,
      term_traditional: item.termTraditional,
      jyutping: item.jyutping,
      mandarin_simplified: item.mandarinSimplified,
      mandarin_traditional: item.mandarinTraditional,
      example_simplified: item.exampleSimplified,
      example_traditional: item.exampleTraditional,
      status: enumValue(item.learningStatus),
      note: item.note,
      source_type: item.subtitleLineId ? "subtitle_line" : item.lessonItemId ? "lesson_item" : null,
      source_id: item.subtitleLineId ?? item.lessonItemId,
    })), request.id, null);
  });

  app.post<{ Body: {
    term_simplified: string; term_traditional: string; jyutping?: string;
    mandarin_simplified?: string; mandarin_traditional?: string;
    example_simplified?: string; example_traditional?: string;
    source_type?: "subtitle_line" | "lesson_item"; source_id?: string; note?: string;
  } }>("/me/wordbook", async (request, reply) => {
    const termTraditional = request.body.term_traditional.trim();
    if (!termTraditional || !request.body.term_simplified.trim()) {
      return reply.code(422).send({ error: { code: "VALIDATION_ERROR", message: "生词不能为空", request_id: request.id } });
    }
    const normalizedKey = termTraditional.replace(/\s+/g, "").toLowerCase();
    const item = await database.wordbookItem.upsert({
      where: { userId_normalizedKey: { userId: request.user.sub, normalizedKey } },
      update: { learningStatus: LearningStatus.LEARNING },
      create: {
        userId: request.user.sub,
        normalizedKey,
        termSimplified: request.body.term_simplified.trim(),
        termTraditional,
        jyutping: request.body.jyutping ?? null,
        mandarinSimplified: request.body.mandarin_simplified ?? null,
        mandarinTraditional: request.body.mandarin_traditional ?? null,
        exampleSimplified: request.body.example_simplified ?? null,
        exampleTraditional: request.body.example_traditional ?? null,
        subtitleLineId: request.body.source_type === "subtitle_line" ? request.body.source_id ?? null : null,
        lessonItemId: request.body.source_type === "lesson_item" ? request.body.source_id ?? null : null,
        note: request.body.note ?? null,
        learningStatus: LearningStatus.LEARNING,
      },
    });
    return reply.code(201).send(dataResponse({ id: item.id, status: enumValue(item.learningStatus) }, request.id));
  });

  app.patch<{ Params: IdParams; Body: StatusBody }>("/me/wordbook/:id", async (request, reply) => {
    const existing = await database.wordbookItem.findFirst({ where: { id: request.params.id, userId: request.user.sub } });
    if (!existing) return notFound(request, reply, "生词不存在");
    const item = await database.wordbookItem.update({
      where: { id: existing.id },
      data: {
        ...(request.body.status ? { learningStatus: statusMap[request.body.status] } : {}),
        ...(request.body.note !== undefined ? { note: request.body.note } : {}),
      },
    });
    return dataResponse({ id: item.id, status: enumValue(item.learningStatus), note: item.note }, request.id);
  });

  app.delete<{ Params: IdParams }>("/me/wordbook/:id", async (request, reply) => {
    const result = await database.wordbookItem.deleteMany({ where: { id: request.params.id, userId: request.user.sub } });
    if (!result.count) return notFound(request, reply, "生词不存在");
    return reply.code(204).send();
  });

  app.put<{ Params: LessonParams; Body: { status: "not_started" | "in_progress" | "completed"; last_item_position?: number } }>(
    "/me/lesson-progress/:lessonId",
    async (request, reply) => {
      const lesson = await database.lesson.findFirst({
        where: { id: request.params.lessonId, status: PublishStatus.PUBLISHED },
        include: { items: { orderBy: { position: "asc" }, select: { id: true, position: true } } },
      });
      if (!lesson) return notFound(request, reply, "课节不存在");
      const lastItem = request.body.last_item_position === undefined
        ? undefined
        : lesson.items.find((item) => item.position === request.body.last_item_position);
      const status = ProgressStatus[request.body.status.toUpperCase() as keyof typeof ProgressStatus];
      const percent = status === ProgressStatus.COMPLETED ? 100 : lastItem && lesson.items.length
        ? Math.round((lastItem.position / lesson.items.length) * 100) : 0;
      const progress = await database.lessonProgress.upsert({
        where: { userId_lessonId: { userId: request.user.sub, lessonId: lesson.id } },
        update: { status, progressPercent: percent, lastItemId: lastItem?.id ?? null, completedAt: status === ProgressStatus.COMPLETED ? new Date() : null },
        create: { userId: request.user.sub, lessonId: lesson.id, status, progressPercent: percent, lastItemId: lastItem?.id ?? null, startedAt: new Date(), completedAt: status === ProgressStatus.COMPLETED ? new Date() : null },
      });
      return dataResponse({ lesson_id: progress.lessonId, status: enumValue(progress.status), progress_percent: progress.progressPercent }, request.id);
    },
  );

  app.put<{ Params: VideoParams; Body: { status: "not_started" | "in_progress" | "completed"; current_ms: number } }>(
    "/me/video-progress/:videoId",
    async (request, reply) => {
      const video = await database.video.findFirst({ where: { id: request.params.videoId, status: VideoStatus.PUBLISHED } });
      if (!video) return notFound(request, reply, "视频不存在");
      if (request.body.current_ms < 0 || request.body.current_ms > video.durationMs) {
        return reply.code(422).send({ error: { code: "VALIDATION_ERROR", message: "播放位置超出视频范围", request_id: request.id } });
      }
      const status = ProgressStatus[request.body.status.toUpperCase() as keyof typeof ProgressStatus];
      const progress = await database.videoProgress.upsert({
        where: { userId_videoId: { userId: request.user.sub, videoId: video.id } },
        update: { status, lastPositionMs: request.body.current_ms, completedAt: status === ProgressStatus.COMPLETED ? new Date() : null },
        create: { userId: request.user.sub, videoId: video.id, status, lastPositionMs: request.body.current_ms, startedAt: new Date(), completedAt: status === ProgressStatus.COMPLETED ? new Date() : null },
      });
      return dataResponse({ video_id: progress.videoId, status: enumValue(progress.status), current_ms: progress.lastPositionMs, duration_ms: video.durationMs, percent: Math.round(progress.lastPositionMs / video.durationMs * 100) }, request.id);
    },
  );

  app.get("/me/learning-summary", async (request) => {
    const [lessonsCompleted, videosStarted, videosCompleted, favoritesLearning, wordbookLearning, recentVideo] = await Promise.all([
      database.lessonProgress.count({ where: { userId: request.user.sub, status: ProgressStatus.COMPLETED } }),
      database.videoProgress.count({ where: { userId: request.user.sub, status: { not: ProgressStatus.NOT_STARTED } } }),
      database.videoProgress.count({ where: { userId: request.user.sub, status: ProgressStatus.COMPLETED } }),
      database.favorite.count({ where: { userId: request.user.sub, learningStatus: LearningStatus.LEARNING } }),
      database.wordbookItem.count({ where: { userId: request.user.sub, learningStatus: LearningStatus.LEARNING } }),
      database.videoProgress.findFirst({ where: { userId: request.user.sub }, orderBy: { updatedAt: "desc" }, include: { video: { select: { slug: true } } } }),
    ]);
    return dataResponse({
      lessons_completed: lessonsCompleted,
      videos_started: videosStarted,
      videos_completed: videosCompleted,
      favorites_learning: favoritesLearning,
      wordbook_learning: wordbookLearning,
      continue_learning: recentVideo ? { type: "video", video_slug: recentVideo.video.slug, current_ms: recentVideo.lastPositionMs } : null,
    }, request.id);
  });
}
