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
    jyutping?: string;
    mandarin?: string;
  }>;
};

type DemoDialogueLine = {
  id: string;
  speaker_simplified: string;
  speaker_traditional: string;
  simplified: string;
  traditional: string;
  jyutping: string;
  mandarin_simplified: string;
  audio_id: string;
};

type DemoLesson = {
  id: string;
  slug: string;
  position: number;
  title_simplified: string;
  title_traditional: string;
  goal_simplified: string;
  goal_traditional: string;
  showcase?: boolean;
  dialogue?: { lines: DemoDialogueLine[] };
};

type DemoCourse = {
  slug: string;
  title_simplified: string;
  title_traditional: string;
  summary_simplified: string;
  summary_traditional: string;
  estimated_minutes: number;
  lessons: DemoLesson[];
};

type AudioManifest = {
  entries: Array<{ id: string; public_url: string }>;
};

const toSimplified = Converter({ from: "hk", to: "cn" });
const transcriptPath = fileURLToPath(
  new URL("../../../content/transcripts/01.compact.json", import.meta.url),
);
const nestleCoffeeTranscriptPath = fileURLToPath(
  new URL("../../../content/transcripts/nestle-coffee-cantonese.compact.json", import.meta.url),
);
const demoCoursePath = fileURLToPath(
  new URL("../../../content/demo/cha-chaan-teng.json", import.meta.url),
);
const audioManifestPath = fileURLToPath(
  new URL("../../../content/audio/fish-audio.demo.json", import.meta.url),
);

const courseSeeds = [
  {
    slug: "restaurant",
    position: 1,
    titleSimplified: "茶餐厅点餐",
    titleTraditional: "茶餐廳點餐",
    summarySimplified: "从入座、点饮品到埋单，走完一次香港茶餐厅的基础对话。",
    summaryTraditional: "從入座、點飲品到埋單，走完一次香港茶餐廳的基礎對話。",
    coverUrl: "/design/assets/city-street.png",
    lessonTitles: ["进店与入座", "说出你想要什么", "加点食物和数量", "加单与其他要求", "埋单与完整对话"],
    lessonTraditionalTitles: [
      "進店與入座",
      "說出你想要什麼",
      "加點食物和數量",
      "加單與其他要求",
      "埋單與完整對話",
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

export type SeedSummary = {
  courses: number;
  lessons: number;
  lessonItems: number;
  videos: number;
  subtitles: number;
};

export async function seedDatabase(database: DatabaseClient): Promise<SeedSummary> {
  const demoCourse = JSON.parse(await readFile(demoCoursePath, "utf8")) as DemoCourse;
  const audioManifest = JSON.parse(await readFile(audioManifestPath, "utf8")) as AudioManifest;
  const audioUrls = new Map(audioManifest.entries.map((entry) => [entry.id, entry.public_url]));
  const showcaseLesson = demoCourse.lessons.find((lesson) => lesson.showcase);
  if (!showcaseLesson?.dialogue) throw new Error("Restaurant showcase lesson is missing dialogue content");
  const drinkPhrases = showcaseLesson.dialogue.lines.map((line) => ({
    sourceId: line.id,
    speakerSimplified: line.speaker_simplified,
    speakerTraditional: line.speaker_traditional,
    simplified: line.simplified,
    traditional: line.traditional,
    jyutping: line.jyutping,
    mandarin: line.mandarin_simplified,
    audioUrl: audioUrls.get(line.audio_id) ?? null,
  }));

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

      if (courseSeed.slug === "restaurant" && index === 1) {
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
          source_id: phrase.sourceId,
          speaker_simplified: phrase.speakerSimplified,
          speaker_traditional: phrase.speakerTraditional,
          text_simplified: phrase.simplified,
          text_traditional: phrase.traditional,
          jyutping: phrase.jyutping,
          mandarin_simplified: phrase.mandarin,
          mandarin_traditional: phrase.mandarin,
        },
        audioUrl: phrase.audioUrl,
        status: ContentReviewStatus.PUBLISHED,
      },
      create: {
        lessonId: firstLessonId,
        stage: LessonStage.DIALOGUE,
        itemType: LessonItemType.DIALOGUE,
        position: index + 1,
        content: {
          source_id: phrase.sourceId,
          speaker_simplified: phrase.speakerSimplified,
          speaker_traditional: phrase.speakerTraditional,
          text_simplified: phrase.simplified,
          text_traditional: phrase.traditional,
          jyutping: phrase.jyutping,
          mandarin_simplified: phrase.mandarin,
          mandarin_traditional: phrase.mandarin,
        },
        audioUrl: phrase.audioUrl,
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

  const nestleCoffeeTranscript = JSON.parse(
    await readFile(nestleCoffeeTranscriptPath, "utf8"),
  ) as Transcript;
  const nestleCoffeeVideo = await database.video.upsert({
    where: { slug: "nestle-coffee" },
    update: {
      durationMs: Math.round(nestleCoffeeTranscript.duration * 1000),
      status: VideoStatus.PUBLISHED,
    },
    create: {
      slug: "nestle-coffee",
      titleSimplified: "影视片段 02：一齐行多步",
      titleTraditional: "影視片段 02：一齊行多步",
      listTitleSimplified: "一齐行多步",
      listTitleTraditional: "一齊行多步",
      summarySimplified: "从见工、搭车到互相帮忙，听懂一段香港粤语动画广告。",
      summaryTraditional: "從見工、搭車到互相幫忙，聽懂一段香港粵語動畫廣告。",
      difficulty: Difficulty.BEGINNER,
      durationMs: Math.round(nestleCoffeeTranscript.duration * 1000),
      videoUrl: "/videos/nestle-coffee-cantonese.mp4",
      posterUrl: "/design/assets/nestle-coffee-cover.png",
      tags: ["动画广告", "职场", "香港日常"],
      focusPoints: ["听辨粤语口语", "逐句重播", "画面字幕对照"],
      sourceNote: "Demo 素材；字幕由画面 OCR 与本地粤语语音识别交叉生成，仍需语言校对。",
      status: VideoStatus.PUBLISHED,
      publishedAt: new Date("2026-08-14T00:00:00.000Z"),
    },
  });

  await Promise.all(nestleCoffeeTranscript.segments.map((segment, index) => {
    const data = {
      startMs: Math.round(segment.start * 1000),
      endMs: Math.round(segment.end * 1000),
      textSimplified: toSimplified(segment.text),
      textTraditional: segment.text,
      jyutping: segment.jyutping ?? null,
      mandarinSimplified: segment.mandarin ?? null,
      reviewStatus: ContentReviewStatus.PUBLISHED,
      aiModel: "vision-ocr+whisper-small+deepseek-v4-flash",
    };
    return database.subtitleLine.upsert({
      where: {
        videoId_position: { videoId: nestleCoffeeVideo.id, position: index + 1 },
      },
      update: data,
      create: {
        videoId: nestleCoffeeVideo.id,
        position: index + 1,
        ...data,
      },
    });
  }));

  const [courses, lessons, lessonItems, videos, subtitles] = await Promise.all([
    database.course.count(),
    database.lesson.count(),
    database.lessonItem.count(),
    database.video.count(),
    database.subtitleLine.count(),
  ]);

  return { courses, lessons, lessonItems, videos, subtitles };
}
