export const AI_PROMPT_VERSION = "subtitle-explanation-v1";

export type SubtitleExplanationInput = {
  subtitleId: string;
  textSimplified: string;
  textTraditional?: string | undefined;
  jyutping?: string | undefined;
  mandarin?: string | undefined;
  context?: string | undefined;
};

export type SubtitleExplanation = {
  meaning: string;
  learning_points: string[];
  usage_note: string;
  similar_expression: string;
};

export type SubtitleExplainer = {
  explain(input: SubtitleExplanationInput): Promise<SubtitleExplanation>;
};

export class DeepSeekResponseError extends Error {}

function isShortString(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

export function parseExplanation(value: unknown): SubtitleExplanation {
  if (!value || typeof value !== "object") throw new DeepSeekResponseError("AI response is not an object");
  const item = value as Record<string, unknown>;
  if (!isShortString(item.meaning, 500)) throw new DeepSeekResponseError("AI meaning is invalid");
  if (!Array.isArray(item.learning_points) || item.learning_points.length < 1 || item.learning_points.length > 3
    || !item.learning_points.every((point) => isShortString(point, 240))) {
    throw new DeepSeekResponseError("AI learning points are invalid");
  }
  if (!isShortString(item.usage_note, 400)) throw new DeepSeekResponseError("AI usage note is invalid");
  if (!isShortString(item.similar_expression, 200)) throw new DeepSeekResponseError("AI similar expression is invalid");
  return {
    meaning: item.meaning.trim(),
    learning_points: item.learning_points.map((point) => point.trim()),
    usage_note: item.usage_note.trim(),
    similar_expression: item.similar_expression.trim(),
  };
}

type DeepSeekOptions = {
  apiKey: string;
  baseUrl?: string | undefined;
  model?: string | undefined;
  timeoutMs?: number | undefined;
};

export function createDeepSeekExplainer(options: DeepSeekOptions): SubtitleExplainer {
  const baseUrl = (options.baseUrl ?? "https://api.deepseek.com").replace(/\/$/, "");
  const model = options.model ?? "deepseek-v4-flash";
  const timeoutMs = options.timeoutMs ?? 30_000;

  return {
    async explain(input) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          "content-type": "application/json",
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 600,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "你是面向粤语初学者的香港粤语助教。只输出合法 JSON，不要 Markdown。不要把不确定内容写成权威结论。JSON 格式：{\"meaning\":\"当前场景含义\",\"learning_points\":[\"1至3个口语点\"],\"usage_note\":\"语气或使用场景\",\"similar_expression\":\"一句类似表达\"}",
            },
            {
              role: "user",
              content: `请讲解这句粤语。输入 JSON：${JSON.stringify({
                text_simplified: input.textSimplified,
                text_traditional: input.textTraditional,
                jyutping: input.jyutping,
                existing_mandarin: input.mandarin,
                context: input.context,
              })}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error(`DeepSeek request failed with status ${response.status}`);
      const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new DeepSeekResponseError("DeepSeek response has no content");
      let parsed: unknown;
      try { parsed = JSON.parse(content); } catch { throw new DeepSeekResponseError("DeepSeek response is not valid JSON"); }
      return parseExplanation(parsed);
    },
  };
}
