-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ScriptPreference" AS ENUM ('SIMPLIFIED', 'TRADITIONAL');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('STARTER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('DRAFT', 'PROCESSING', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentReviewStatus" AS ENUM ('DRAFT', 'AI_DRAFT', 'REVIEWED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LessonStage" AS ENUM ('INTRO', 'WORDS', 'PATTERNS', 'DIALOGUE', 'QUIZ', 'SUMMARY');

-- CreateEnum
CREATE TYPE "LessonItemType" AS ENUM ('INTRO', 'CHARACTER', 'PHRASE', 'DIALOGUE', 'TIP');

-- CreateEnum
CREATE TYPE "CourseVideoRelationType" AS ENUM ('RECOMMENDED', 'PRACTICE', 'RELATED');

-- CreateEnum
CREATE TYPE "LessonVideoRelationType" AS ENUM ('PRACTICE', 'EXAMPLE', 'RELATED');

-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('SAVED', 'LEARNING', 'MASTERED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ContentJobType" AS ENUM ('TRANSCRIBE', 'SUBTITLE_ENRICH', 'TTS');

-- CreateEnum
CREATE TYPE "ContentJobProvider" AS ENUM ('LOCAL_WHISPER', 'DEEPSEEK', 'FISH_AUDIO');

-- CreateEnum
CREATE TYPE "ContentJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "display_name" VARCHAR(80) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
    "script_preference" "ScriptPreference" NOT NULL DEFAULT 'SIMPLIFIED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "position" INTEGER NOT NULL,
    "title_simplified" TEXT NOT NULL,
    "title_traditional" TEXT NOT NULL,
    "summary_simplified" TEXT NOT NULL,
    "summary_traditional" TEXT NOT NULL,
    "cover_url" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'STARTER',
    "estimated_minutes" INTEGER NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "position" INTEGER NOT NULL,
    "title_simplified" TEXT NOT NULL,
    "title_traditional" TEXT NOT NULL,
    "summary_simplified" TEXT NOT NULL,
    "summary_traditional" TEXT NOT NULL,
    "goal_simplified" TEXT NOT NULL,
    "goal_traditional" TEXT NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_items" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "stage" "LessonStage" NOT NULL,
    "item_type" "LessonItemType" NOT NULL,
    "position" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "audio_url" TEXT,
    "status" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lesson_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title_simplified" TEXT NOT NULL,
    "title_traditional" TEXT NOT NULL,
    "list_title_simplified" TEXT NOT NULL,
    "list_title_traditional" TEXT NOT NULL,
    "summary_simplified" TEXT NOT NULL,
    "summary_traditional" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'STARTER',
    "duration_ms" INTEGER NOT NULL,
    "video_url" TEXT NOT NULL,
    "poster_url" TEXT NOT NULL,
    "tags" TEXT[],
    "focus_points" JSONB NOT NULL,
    "source_note" TEXT,
    "status" "VideoStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_video_links" (
    "course_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "relation_type" "CourseVideoRelationType" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "course_video_links_pkey" PRIMARY KEY ("course_id","video_id")
);

-- CreateTable
CREATE TABLE "lesson_video_links" (
    "lesson_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "relation_type" "LessonVideoRelationType" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "lesson_video_links_pkey" PRIMARY KEY ("lesson_id","video_id")
);

-- CreateTable
CREATE TABLE "subtitle_lines" (
    "id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "start_ms" INTEGER NOT NULL,
    "end_ms" INTEGER NOT NULL,
    "speaker" VARCHAR(80),
    "text_simplified" TEXT NOT NULL,
    "text_traditional" TEXT NOT NULL,
    "jyutping" TEXT,
    "mandarin_simplified" TEXT,
    "mandarin_traditional" TEXT,
    "audio_url" TEXT,
    "review_status" "ContentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "asr_confidence" DECIMAL(5,4),
    "ai_model" VARCHAR(100),
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subtitle_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subtitle_line_id" UUID,
    "lesson_item_id" UUID,
    "learning_status" "LearningStatus" NOT NULL DEFAULT 'SAVED',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordbook_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "normalized_key" VARCHAR(200) NOT NULL,
    "term_simplified" TEXT NOT NULL,
    "term_traditional" TEXT NOT NULL,
    "jyutping" TEXT,
    "mandarin_simplified" TEXT,
    "mandarin_traditional" TEXT,
    "example_simplified" TEXT,
    "example_traditional" TEXT,
    "example_jyutping" TEXT,
    "audio_url" TEXT,
    "subtitle_line_id" UUID,
    "lesson_item_id" UUID,
    "learning_status" "LearningStatus" NOT NULL DEFAULT 'SAVED',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wordbook_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress_percent" SMALLINT NOT NULL DEFAULT 0,
    "last_item_id" UUID,
    "started_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("user_id","lesson_id")
);

-- CreateTable
CREATE TABLE "video_progress" (
    "user_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "last_position_ms" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "video_progress_pkey" PRIMARY KEY ("user_id","video_id")
);

-- CreateTable
CREATE TABLE "content_jobs" (
    "id" UUID NOT NULL,
    "job_type" "ContentJobType" NOT NULL,
    "video_id" UUID,
    "lesson_id" UUID,
    "provider" "ContentJobProvider" NOT NULL,
    "status" "ContentJobStatus" NOT NULL DEFAULT 'QUEUED',
    "input_hash" VARCHAR(64),
    "result_summary" JSONB,
    "error_code" VARCHAR(80),
    "error_message" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "content_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_published_at_idx" ON "courses"("status", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "lessons_course_id_slug_key" ON "lessons"("course_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_course_id_position_key" ON "lessons"("course_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_items_lesson_id_position_key" ON "lesson_items"("lesson_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "videos_slug_key" ON "videos"("slug");

-- CreateIndex
CREATE INDEX "videos_status_published_at_idx" ON "videos"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "course_video_links_course_id_position_idx" ON "course_video_links"("course_id", "position");

-- CreateIndex
CREATE INDEX "lesson_video_links_lesson_id_position_idx" ON "lesson_video_links"("lesson_id", "position");

-- CreateIndex
CREATE INDEX "subtitle_lines_video_id_start_ms_end_ms_idx" ON "subtitle_lines"("video_id", "start_ms", "end_ms");

-- CreateIndex
CREATE UNIQUE INDEX "subtitle_lines_video_id_position_key" ON "subtitle_lines"("video_id", "position");

-- CreateIndex
CREATE INDEX "favorites_user_id_updated_at_idx" ON "favorites"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_subtitle_line_id_key" ON "favorites"("user_id", "subtitle_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_lesson_item_id_key" ON "favorites"("user_id", "lesson_item_id");

-- CreateIndex
CREATE INDEX "wordbook_items_user_id_updated_at_idx" ON "wordbook_items"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "wordbook_items_user_id_normalized_key_key" ON "wordbook_items"("user_id", "normalized_key");

-- CreateIndex
CREATE INDEX "lesson_progress_user_id_updated_at_idx" ON "lesson_progress"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "video_progress_user_id_updated_at_idx" ON "video_progress"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "content_jobs_status_created_at_idx" ON "content_jobs"("status", "created_at");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_items" ADD CONSTRAINT "lesson_items_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_video_links" ADD CONSTRAINT "course_video_links_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_video_links" ADD CONSTRAINT "course_video_links_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_video_links" ADD CONSTRAINT "lesson_video_links_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_video_links" ADD CONSTRAINT "lesson_video_links_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtitle_lines" ADD CONSTRAINT "subtitle_lines_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtitle_lines" ADD CONSTRAINT "subtitle_lines_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_subtitle_line_id_fkey" FOREIGN KEY ("subtitle_line_id") REFERENCES "subtitle_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_lesson_item_id_fkey" FOREIGN KEY ("lesson_item_id") REFERENCES "lesson_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordbook_items" ADD CONSTRAINT "wordbook_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordbook_items" ADD CONSTRAINT "wordbook_items_subtitle_line_id_fkey" FOREIGN KEY ("subtitle_line_id") REFERENCES "subtitle_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordbook_items" ADD CONSTRAINT "wordbook_items_lesson_item_id_fkey" FOREIGN KEY ("lesson_item_id") REFERENCES "lesson_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_last_item_id_fkey" FOREIGN KEY ("last_item_id") REFERENCES "lesson_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_jobs" ADD CONSTRAINT "content_jobs_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_jobs" ADD CONSTRAINT "content_jobs_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_jobs" ADD CONSTRAINT "content_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain constraints not expressible in the Prisma schema
ALTER TABLE "courses"
  ADD CONSTRAINT "courses_position_positive" CHECK ("position" > 0),
  ADD CONSTRAINT "courses_estimated_minutes_positive" CHECK ("estimated_minutes" > 0);

ALTER TABLE "lessons"
  ADD CONSTRAINT "lessons_position_positive" CHECK ("position" > 0),
  ADD CONSTRAINT "lessons_estimated_minutes_positive" CHECK ("estimated_minutes" > 0);

ALTER TABLE "lesson_items"
  ADD CONSTRAINT "lesson_items_position_positive" CHECK ("position" > 0);

ALTER TABLE "videos"
  ADD CONSTRAINT "videos_duration_positive" CHECK ("duration_ms" > 0);

ALTER TABLE "course_video_links"
  ADD CONSTRAINT "course_video_links_position_positive" CHECK ("position" > 0);

ALTER TABLE "lesson_video_links"
  ADD CONSTRAINT "lesson_video_links_position_positive" CHECK ("position" > 0);

ALTER TABLE "subtitle_lines"
  ADD CONSTRAINT "subtitle_lines_position_positive" CHECK ("position" > 0),
  ADD CONSTRAINT "subtitle_lines_time_range_valid" CHECK ("start_ms" >= 0 AND "end_ms" > "start_ms");

ALTER TABLE "favorites"
  ADD CONSTRAINT "favorites_exactly_one_source" CHECK (
    ("subtitle_line_id" IS NOT NULL AND "lesson_item_id" IS NULL)
    OR ("subtitle_line_id" IS NULL AND "lesson_item_id" IS NOT NULL)
  );

ALTER TABLE "wordbook_items"
  ADD CONSTRAINT "wordbook_items_at_most_one_source" CHECK (
    NOT ("subtitle_line_id" IS NOT NULL AND "lesson_item_id" IS NOT NULL)
  );

ALTER TABLE "lesson_progress"
  ADD CONSTRAINT "lesson_progress_percent_valid" CHECK ("progress_percent" BETWEEN 0 AND 100);

ALTER TABLE "video_progress"
  ADD CONSTRAINT "video_progress_position_non_negative" CHECK ("last_position_ms" >= 0);

ALTER TABLE "content_jobs"
  ADD CONSTRAINT "content_jobs_exactly_one_target" CHECK (
    ("video_id" IS NOT NULL AND "lesson_id" IS NULL)
    OR ("video_id" IS NULL AND "lesson_id" IS NOT NULL)
  );
