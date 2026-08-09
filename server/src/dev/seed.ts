import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { Converter } from "opencc-js/t2cn";

import {
  ContentReviewStatus,
  CourseVideoRelationType,
  Difficulty,
  LessonItemType,
  LessonStage,
  LessonVideoRelationType,
  PublishStatus,
  VideoStatus,
} from "../generated/prisma/enums.js";
import type { DatabaseClient } from "../lib/prisma.js";

type Transcript = {
  duration: number;
  segments: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
  }>;
};

const toSimplified = Converter({ from: "hk", to: "cn" });
const transcriptPath = fileURLToPath(
  new URL("../../../content/transcripts/01.compact.json", import.meta.url),
);

const courseSeeds = [
  {
    slug: "restaurant",
    position: 1,
    titleSimplified: "茶餐厅点餐",
    titleTraditional: "茶餐廳點餐",
    summarySimplified: "从一杯冻柠茶开始，学会最自然的点餐表达。",
    summaryTraditional: "從一杯凍檸茶開始，學會最自然的點餐表達。",
    coverUrl: "/design/assets/city-street.png",
    lessonTitles: ["点饮品", "礼貌开口", "点主食", "提出要求", "完整情景对话"],
    lessonTraditionalTitles: [
      "點飲品",
      "禮貌開口",
      "點主食",
      "提出要求",
      "完整情景對話",
    ],
  },
  {
    slug: "transport",
    position: 2,
    titleSimplified: "搭车问路",
    titleTraditional: "搭車問路",
    summarySimplified: "听懂站名、方向和香港人常说的路线提示。",
    summaryTraditional: "聽懂站名、方向和香港人常說的路線提示。",
    coverUrl: "/design/assets/hero-hk-street.png",
    lessonTitles: ["确认方向", "港铁问路", "巴士落车", "小巴表达", "路线复习"],
    lessonTraditionalTitles: [
      "確認方向",
      "港鐵問路",
      "巴士落車",
      "小巴表達",
      "路線複習",
    ],
  },
  {
    slug: "shopping",
    position: 3,
    titleSimplified: "街市买嘢",
    titleTraditional: "街市買嘢",
    summarySimplified: "学数量、价格和地道又有礼貌的买卖对话。",
    summaryTraditional: "學數量、價格和地道又有禮貌的買賣對話。",
    coverUrl: "/design/assets/city-buildings.png",
    lessonTitles: ["问价钱", "数量单位", "拣选货品", "完成买卖"],
    lessonTraditionalTitles: ["問價錢", "數量單位", "揀選貨品", "完成買賣"],
  },
] as const;

const drinkPhrases = [
  {
    simplified: "唔该，想要一杯冻柠茶。",
    traditional: "唔該，想要一杯凍檸茶。",
    jyutping: "m4 goi1, soeng2 jiu3 jat1 bui1 dung3 ning4 caa4.",
    mandarin: "麻烦，我想要一杯冰柠檬茶。",
  },
  {
    simplified: "要唔要少甜呀？",
    traditional: "要唔要少甜呀？",
    jyutping: "jiu3 m4 jiu3 siu2 tim4 aa3?",
    mandarin: "要不要少甜？",
  },
  {
    simplified: "少甜吖，唔该。",
    traditional: "少甜吖，唔該。",
    jyutping: "siu2 tim4 aa1, m4 goi1.",
    mandarin: "少甜，谢谢。",
  },
  {
    simplified: "仲有冇其他嘢要呀？",
    traditional: "仲有冇其他嘢要呀？",
    jyutping: "zung6 jau5 mou5 kei4 taa1 je5 jiu3 aa3?",
    mandarin: "还需要其他东西吗？",
  },
  {
    simplified: "再要一个菠萝油，唔该。",
    traditional: "再要一個菠蘿油，唔該。",
    jyutping: "zoi3 jiu3 jat1 go3 bo1 lo4 jau4, m4 goi1.",
    mandarin: "再要一个菠萝油，谢谢。",
  },
] as const;

export type SeedSummary = {
  courses: number;
  lessons: number;
  lessonItems: number;
  videos: number;
  subtitles: number;
};

export async function seedDatabase(database: DatabaseClient): Promise<SeedSummary> {
  let firstLessonId: string | undefined;
  const courseIds = new Map<string, string>();

  for (const courseSeed of courseSeeds) {
    const course = await database.course.upsert({
      where: { slug: courseSeed.slug },
      update: {
        position: courseSeed.position,
        titleSimplified: courseSeed.titleSimplified,
        titleTraditional: courseSeed.titleTraditional,
        summarySimplified: courseSeed.summarySimplified,
        summaryTraditional: courseSeed.summaryTraditional,
        coverUrl: courseSeed.coverUrl,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date("2026-08-09T00:00:00.000Z"),
      },
      create: {
        slug: courseSeed.slug,
        position: courseSeed.position,
        titleSimplified: courseSeed.titleSimplified,
        titleTraditional: courseSeed.titleTraditional,
        summarySimplified: courseSeed.summarySimplified,
        summaryTraditional: courseSeed.summaryTraditional,
        coverUrl: courseSeed.coverUrl,
        difficulty: Difficulty.STARTER,
        estimatedMinutes: courseSeed.lessonTitles.length * 8,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date("2026-08-09T00:00:00.000Z"),
      },
    });
    courseIds.set(courseSeed.slug, course.id);

    for (const [index, title] of courseSeed.lessonTitles.entries()) {
      const lesson = await database.lesson.upsert({
        where: {
          courseId_slug: {
            courseId: course.id,
            slug: `lesson-${index + 1}`,
          },
        },
        update: {
          position: index + 1,
          titleSimplified: title,
          titleTraditional: courseSeed.lessonTraditionalTitles[index] ?? title,
          status: PublishStatus.PUBLISHED,
        },
        create: {
          courseId: course.id,
          slug: `lesson-${index + 1}`,
          position: index + 1,
          titleSimplified: title,
          titleTraditional: courseSeed.lessonTraditionalTitles[index] ?? title,
          summarySimplified: `学习“${title}”场景中的常用粤语表达。`,
          summaryTraditional: `學習「${courseSeed.lessonTraditionalTitles[index] ?? title}」場景中的常用粵語表達。`,
          goalSimplified: "能听懂并使用本课的核心表达。",
          goalTraditional: "能聽懂並使用本課的核心表達。",
          estimatedMinutes: 8,
          status: PublishStatus.PUBLISHED,
        },
      });

      if (courseSeed.slug === "restaurant" && index === 0) {
        firstLessonId = lesson.id;
      }
    }
  }

  if (!firstLessonId) throw new Error("Restaurant starter lesson was not created");

  for (const [index, phrase] of drinkPhrases.entries()) {
    await database.lessonItem.upsert({
      where: {
        lessonId_position: { lessonId: firstLessonId, position: index + 1 },
      },
      update: {
        content: {
          text_simplified: phrase.simplified,
          text_traditional: phrase.traditional,
          jyutping: phrase.jyutping,
          mandarin_simplified: phrase.mandarin,
          mandarin_traditional: phrase.mandarin,
        },
        status: ContentReviewStatus.PUBLISHED,
      },
      create: {
        lessonId: firstLessonId,
        stage: LessonStage.DIALOGUE,
        itemType: LessonItemType.PHRASE,
        position: index + 1,
        content: {
          text_simplified: phrase.simplified,
          text_traditional: phrase.traditional,
          jyutping: phrase.jyutping,
          mandarin_simplified: phrase.mandarin,
          mandarin_traditional: phrase.mandarin,
        },
        status: ContentReviewStatus.PUBLISHED,
      },
    });
  }

  const transcript = JSON.parse(
    await readFile(transcriptPath, "utf8"),
  ) as Transcript;
  const video = await database.video.upsert({
    where: { slug: "cha-chaan-teng" },
    update: {
      durationMs: Math.round(transcript.duration * 1000),
      status: VideoStatus.PUBLISHED,
    },
    create: {
      slug: "cha-chaan-teng",
      titleSimplified: "影视片段 01：粤语对白练习",
      titleTraditional: "影視片段 01：粵語對白練習",
      listTitleSimplified: "粤语对白练习 01",
      listTitleTraditional: "粵語對白練習 01",
      summarySimplified: "跟随真实影视片段，练习听懂香港日常对白。字幕为开发测试稿，仍需校对。",
      summaryTraditional: "跟隨真實影視片段，練習聽懂香港日常對白。字幕為開發測試稿，仍需校對。",
      difficulty: Difficulty.STARTER,
      durationMs: Math.round(transcript.duration * 1000),
      videoUrl: "/videos/01.mp4",
      posterUrl: "/design/assets/video-01-cover.png",
      tags: ["职场", "律师楼", "日常对白"],
      focusPoints: ["听辨语气", "逐句重播", "收藏台词"],
      sourceNote: "开发测试素材；自动转写字幕尚未完成语言校对。",
      status: VideoStatus.PUBLISHED,
      publishedAt: new Date("2026-08-09T00:00:00.000Z"),
    },
  });

  const restaurantCourseId = courseIds.get("restaurant");
  if (!restaurantCourseId) throw new Error("Restaurant course was not created");

  await database.courseVideoLink.upsert({
    where: {
      courseId_videoId: { courseId: restaurantCourseId, videoId: video.id },
    },
    update: { relationType: CourseVideoRelationType.RELATED, position: 1 },
    create: {
      courseId: restaurantCourseId,
      videoId: video.id,
      relationType: CourseVideoRelationType.RELATED,
      position: 1,
    },
  });
  await database.lessonVideoLink.upsert({
    where: {
      lessonId_videoId: { lessonId: firstLessonId, videoId: video.id },
    },
    update: { relationType: LessonVideoRelationType.RELATED, position: 1 },
    create: {
      lessonId: firstLessonId,
      videoId: video.id,
      relationType: LessonVideoRelationType.RELATED,
      position: 1,
    },
  });

  await database.subtitleLine.createMany({
    data: transcript.segments.map((segment, index) => ({
      videoId: video.id,
      position: index + 1,
      startMs: Math.round(segment.start * 1000),
      endMs: Math.round(segment.end * 1000),
      textSimplified: toSimplified(segment.text),
      textTraditional: segment.text,
      reviewStatus: ContentReviewStatus.PUBLISHED,
      aiModel: "local-whisper-draft",
    })),
    skipDuplicates: true,
  });

  const [courses, lessons, lessonItems, videos, subtitles] = await Promise.all([
    database.course.count(),
    database.lesson.count(),
    database.lessonItem.count(),
    database.video.count(),
    database.subtitleLine.count(),
  ]);

  return { courses, lessons, lessonItems, videos, subtitles };
}
