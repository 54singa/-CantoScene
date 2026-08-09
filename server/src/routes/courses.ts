import type { FastifyInstance } from "fastify";

import {
  ContentReviewStatus,
  Difficulty,
  PublishStatus,
} from "../generated/prisma/enums.js";
import { dataResponse, enumValue, listResponse } from "../lib/http.js";
import type { DatabaseClient } from "../lib/prisma.js";

type CourseListQuery = {
  difficulty?: "starter" | "beginner" | "intermediate" | "advanced";
  limit?: number;
};

type CourseParams = { courseSlug: string };
type LessonParams = { lessonId: string };

export async function courseRoutes(
  app: FastifyInstance,
  database: DatabaseClient,
): Promise<void> {
  app.get<{ Querystring: CourseListQuery }>(
    "/courses",
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
      const courses = await database.course.findMany({
        where: {
          status: PublishStatus.PUBLISHED,
          ...(request.query.difficulty
            ? {
                difficulty:
                  Difficulty[
                    request.query.difficulty.toUpperCase() as keyof typeof Difficulty
                  ],
              }
            : {}),
        },
        orderBy: { position: "asc" },
        take: request.query.limit ?? 20,
        include: {
          _count: {
            select: {
              lessons: { where: { status: PublishStatus.PUBLISHED } },
            },
          },
        },
      });

      return listResponse(
        courses.map((course) => ({
          id: course.id,
          slug: course.slug,
          title_simplified: course.titleSimplified,
          title_traditional: course.titleTraditional,
          summary_simplified: course.summarySimplified,
          summary_traditional: course.summaryTraditional,
          cover_url: course.coverUrl,
          difficulty: enumValue(course.difficulty),
          lesson_count: course._count.lessons,
          estimated_minutes: course.estimatedMinutes,
          progress: null,
        })),
        request.id,
        null,
      );
    },
  );

  app.get<{ Params: CourseParams }>(
    "/courses/:courseSlug",
    async (request, reply) => {
      const course = await database.course.findFirst({
        where: {
          slug: request.params.courseSlug,
          status: PublishStatus.PUBLISHED,
        },
        include: {
          lessons: {
            where: { status: PublishStatus.PUBLISHED },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!course) {
        return reply.code(404).send({
          error: {
            code: "NOT_FOUND",
            message: "课程不存在",
            request_id: request.id,
          },
        });
      }

      return dataResponse(
        {
          id: course.id,
          slug: course.slug,
          title_simplified: course.titleSimplified,
          title_traditional: course.titleTraditional,
          summary_simplified: course.summarySimplified,
          summary_traditional: course.summaryTraditional,
          cover_url: course.coverUrl,
          difficulty: enumValue(course.difficulty),
          estimated_minutes: course.estimatedMinutes,
          lessons: course.lessons.map((lesson) => ({
            id: lesson.id,
            slug: lesson.slug,
            title_simplified: lesson.titleSimplified,
            title_traditional: lesson.titleTraditional,
            position: lesson.position,
            estimated_minutes: lesson.estimatedMinutes,
            is_available: true,
            progress: null,
          })),
          progress: null,
        },
        request.id,
      );
    },
  );

  app.get<{ Params: LessonParams }>(
    "/lessons/:lessonId",
    async (request, reply) => {
      const lesson = await database.lesson.findFirst({
        where: {
          id: request.params.lessonId,
          status: PublishStatus.PUBLISHED,
          course: { status: PublishStatus.PUBLISHED },
        },
        include: {
          items: {
            where: { status: ContentReviewStatus.PUBLISHED },
            orderBy: { position: "asc" },
          },
          videoLinks: {
            orderBy: { position: "asc" },
            include: { video: true },
          },
        },
      });

      if (!lesson) {
        return reply.code(404).send({
          error: {
            code: "NOT_FOUND",
            message: "课节不存在",
            request_id: request.id,
          },
        });
      }

      return dataResponse(
        {
          id: lesson.id,
          course_id: lesson.courseId,
          slug: lesson.slug,
          title_simplified: lesson.titleSimplified,
          title_traditional: lesson.titleTraditional,
          summary_simplified: lesson.summarySimplified,
          summary_traditional: lesson.summaryTraditional,
          goal_simplified: lesson.goalSimplified,
          goal_traditional: lesson.goalTraditional,
          position: lesson.position,
          estimated_minutes: lesson.estimatedMinutes,
          items: lesson.items.map((item) => ({
            id: item.id,
            type: enumValue(item.itemType),
            stage: enumValue(item.stage),
            position: item.position,
            content: item.content,
            audio_url: item.audioUrl,
          })),
          related_videos: lesson.videoLinks
            .filter((link) => link.video.status === "PUBLISHED")
            .map((link) => ({
              id: link.video.id,
              slug: link.video.slug,
              title_simplified: link.video.titleSimplified,
              title_traditional: link.video.titleTraditional,
              poster_url: link.video.posterUrl,
              duration_ms: link.video.durationMs,
            })),
          progress: null,
        },
        request.id,
      );
    },
  );
}
