import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const sourcePath = resolve(process.argv[2] ?? 'content/transcripts/nestle-coffee-cantonese.compact.json')
const outputPath = resolve(process.argv[3] ?? 'content/transcripts/nestle-coffee-cantonese.enriched.json')

function parseEnv(source) {
  return Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return []
    const separator = trimmed.indexOf('=')
    if (separator < 1) return []
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
    return [[key, value]]
  }))
}

const env = parseEnv(await readFile(resolve('server/.env'), 'utf8'))
if (!env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY is missing from server/.env')

const transcript = JSON.parse(await readFile(sourcePath, 'utf8'))
const batches = []
for (let index = 0; index < transcript.segments.length; index += 10) {
  batches.push(transcript.segments.slice(index, index + 10))
}

async function enrich(batch) {
  const response = await fetch(`${(env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(Number(env.DEEPSEEK_TIMEOUT_MS || 60_000)),
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
      temperature: 0.1,
      max_tokens: 4000,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是香港粤语语言编辑。只输出合法 JSON，不要 Markdown。必须保留每句输入原文，不得改字。为每句提供 LSHK 粤拼（数字声调、词间空格）和面向普通话初学者的自然释义。粤拼必须逐字覆盖中文口语；英文、数字及品牌名可保留原样。JSON 格式：{"items":[{"id":"line-1","text":"原文","jyutping":"...","mandarin":"..."}]}。',
        },
        {
          role: 'user',
          content: `请处理以下已由用户人工校对的繁体粤语字幕：${JSON.stringify(batch.map(({ id, text }) => ({ id, text })))}`,
        },
      ],
    }),
  })
  if (!response.ok) throw new Error(`DeepSeek request failed: ${response.status}`)
  const payload = await response.json()
  if (payload.choices?.[0]?.finish_reason === 'length') throw new Error('DeepSeek response was truncated')
  const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? '')
  if (!Array.isArray(parsed.items) || parsed.items.length !== batch.length) throw new Error('DeepSeek returned an invalid item count')
  const inputById = new Map(batch.map((item) => [item.id, item]))
  return parsed.items.map((item) => {
    const input = inputById.get(item.id)
    if (!input || item.text !== input.text || typeof item.jyutping !== 'string' || !item.jyutping.trim()
      || typeof item.mandarin !== 'string' || !item.mandarin.trim()) {
      throw new Error(`DeepSeek returned an invalid item: ${item.id ?? 'unknown'}`)
    }
    return { ...input, jyutping: item.jyutping.trim(), mandarin: item.mandarin.trim() }
  })
}

const enrichedSegments = []
for (const [index, batch] of batches.entries()) {
  let result
  let lastError
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      result = await enrich(batch)
      break
    } catch (error) {
      lastError = error
    }
  }
  if (!result) throw lastError
  enrichedSegments.push(...result)
  process.stdout.write(`Enriched batch ${index + 1}/${batches.length}\n`)
}

await writeFile(outputPath, `${JSON.stringify({ ...transcript, segments: enrichedSegments }, null, 2)}\n`, 'utf8')
process.stdout.write(`Saved ${enrichedSegments.length} enriched subtitles to ${outputPath}\n`)
