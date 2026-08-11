import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const contentPath = resolve(root, 'content/demo/cha-chaan-teng.json')
const manifestPath = resolve(root, 'content/audio/fish-audio.demo.json')
const requireFiles = process.argv.includes('--require-files')

const content = JSON.parse(await readFile(contentPath, 'utf8'))
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const ids = new Set()
function unique(id, label) {
  assert(typeof id === 'string' && id.length > 0, `${label} 缺少稳定 ID`)
  assert(!ids.has(id), `重复 ID: ${id}`)
  ids.add(id)
}

unique(content.id, '课程')
assert(content.schema_version === 1, '不支持的课程 schema_version')
assert(content.review_status === 'demo_draft', 'Demo 课程必须保持 demo_draft 标记')
assert(Array.isArray(content.lessons) && content.lessons.length === 5, '茶餐厅 Demo 必须保留 5 课节结构')

const showcase = content.lessons.filter((lesson) => lesson.showcase)
assert(showcase.length === 1, 'Demo 必须且只能有一节完整示范课')

const audioReferences = new Set()
for (const lesson of content.lessons) {
  unique(lesson.id, '课节')
  for (const word of lesson.words ?? []) {
    unique(word.id, '字词')
    audioReferences.add(word.audio_id)
  }
  for (const pattern of lesson.patterns ?? []) unique(pattern.id, '句型')
  for (const example of lesson.examples ?? []) {
    unique(example.id, '例句')
    audioReferences.add(example.audio_id)
  }
  if (lesson.dialogue) {
    unique(lesson.dialogue.id, '对话')
    for (const line of lesson.dialogue.lines) {
      unique(line.id, '对话台词')
      audioReferences.add(line.audio_id)
    }
  }
  for (const exercise of lesson.exercises ?? []) unique(exercise.id, '练习')
}

assert(manifest.schema_version === 1, '不支持的音频 manifest schema_version')
assert(manifest.voice?.model_id === 'be60c03139d94dc7b0c26d83f66550db', 'Fish Audio 音色 ID 与已确定方案不一致')
assert(Array.isArray(manifest.entries), '音频 manifest 缺少 entries')
assert(manifest.entries.length >= 10 && manifest.entries.length <= 20, 'Demo 音频数量应控制在 10—20 条')

const manifestIds = new Set()
for (const entry of manifest.entries) {
  assert(!manifestIds.has(entry.id), `音频 manifest 重复 ID: ${entry.id}`)
  manifestIds.add(entry.id)
  assert(['word', 'example', 'dialogue'].includes(entry.kind), `未知音频类型: ${entry.kind}`)
  assert(typeof entry.text === 'string' && entry.text.length > 0, `音频 ${entry.id} 缺少生成文本`)
  assert(entry.output.startsWith(`public/audio/${entry.kind === 'dialogue' ? 'dialogue' : `${entry.kind}s`}/`), `音频 ${entry.id} 输出目录不正确`)
  assert(entry.public_url.startsWith('/audio/'), `音频 ${entry.id} 公开 URL 不正确`)
  if (requireFiles) await access(resolve(root, entry.output))
}

for (const audioId of audioReferences) {
  assert(manifestIds.has(audioId), `课程引用的音频不在 manifest 中: ${audioId}`)
}

console.log(JSON.stringify({
  course: content.slug,
  lessons: content.lessons.length,
  showcase_lesson: showcase[0].id,
  content_audio_references: audioReferences.size,
  audio_entries: manifest.entries.length,
  audio_files_required: requireFiles,
}))
