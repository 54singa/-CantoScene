import { Converter } from 'opencc-js/t2cn'
import video01Transcript from '../content/transcripts/01.compact.json'

const toSimplifiedChinese = Converter({ from: 'hk', to: 'cn' })

export type Subtitle = {
  id: string
  start: number
  end: number
  yue: string
  traditional: string
  jyutping: string
  mandarin: string
}

export type FavoriteLine = Subtitle & {
  videoTitle: string
  savedAt: string
  serverId?: string
  videoId?: string
  videoSlug?: string
}

export const subtitles: Subtitle[] = [
  { id: 'line-1', start: 0, end: 4.8, yue: '唔该，想要一杯冻柠茶。', traditional: '唔該，想要一杯凍檸茶。', jyutping: 'm4 goi1, soeng2 jiu3 jat1 bui1 dung3 ning4 caa4.', mandarin: '麻烦，我想要一杯冰柠檬茶。' },
  { id: 'line-2', start: 4.8, end: 8.9, yue: '要唔要少甜呀？', traditional: '要唔要少甜呀？', jyutping: 'jiu3 m4 jiu3 siu2 tim4 aa3?', mandarin: '要不要少甜？' },
  { id: 'line-3', start: 8.9, end: 13.4, yue: '少甜吖，唔该。', traditional: '少甜吖，唔該。', jyutping: 'siu2 tim4 aa1, m4 goi1.', mandarin: '少甜，谢谢。' },
  { id: 'line-4', start: 13.4, end: 18.2, yue: '仲有冇其他嘢要呀？', traditional: '仲有冇其他嘢要呀？', jyutping: 'zung6 jau5 mou5 kei4 taa1 je5 jiu3 aa3?', mandarin: '还需要其他东西吗？' },
  { id: 'line-5', start: 18.2, end: 23.5, yue: '再要一个菠萝油，唔该。', traditional: '再要一個菠蘿油，唔該。', jyutping: 'zoi3 jiu3 jat1 go3 bo1 lo4 jau4, m4 goi1.', mandarin: '再要一个菠萝油，谢谢。' },
]

export const video01Subtitles: Subtitle[] = video01Transcript.segments.map((segment) => ({
  id: segment.id,
  start: segment.start,
  end: segment.end,
  yue: toSimplifiedChinese(segment.text),
  traditional: segment.text,
  jyutping: 'Jyutping 待校对后生成',
  mandarin: '普通话释义将在字幕校对后生成。',
}))

export const courseUnits = [
  { id: 'restaurant', no: '01', title: '茶餐厅点餐', traditional: '茶餐廳點餐', desc: '从一杯冻柠茶开始，学会最自然的点餐表达。', lessons: 5, progress: 40, tone: 'peach' },
  { id: 'transport', no: '02', title: '搭车问路', traditional: '搭車問路', desc: '听懂站名、方向和香港人常说的路线提示。', lessons: 5, progress: 0, tone: 'sky' },
  { id: 'shopping', no: '03', title: '街市买嘢', traditional: '街市買嘢', desc: '学数量、价格和地道又有礼貌的买卖对话。', lessons: 4, progress: 0, tone: 'butter' },
]

export const videos = [
  { id: 'cha-chaan-teng', title: '第一次在茶餐厅点餐', traditional: '第一次在茶餐廳點餐', eyebrow: '茶餐厅 · 23 秒', level: '入门', image: '/design/assets/city-street.png', desc: '冻柠茶、少甜、菠萝油——先听懂一段真实点餐。' },
  { id: 'morning', title: '香港人的一声早晨', traditional: '香港人的一聲早晨', eyebrow: '街头 · 35 秒', level: '入门', image: '/design/assets/hero-hk-street.png', desc: '从打招呼开始，听见语气里的亲切和距离。' },
  { id: 'minibus', title: '小巴落车要点讲？', traditional: '小巴落車要點講？', eyebrow: '交通 · 42 秒', level: '进阶', image: '/design/assets/city-buildings.png', desc: '一句“有落”，是许多初学者的香港生活第一课。' },
]

export const jyutpingGroups = [
  { title: '声母', traditional: '聲母', desc: '字音开头的辅音', items: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'ng', 'h', 'gw', 'kw', 'w', 'z', 'c', 's', 'j'] },
  { title: '韵母', traditional: '韻母', desc: '字音的主体和收尾', items: ['aa', 'aai', 'aau', 'aam', 'aan', 'aang', 'aap', 'aat', 'aak', 'ai', 'au', 'am', 'an', 'ang', 'ap', 'at', 'ak', 'e', 'ei', 'eng', 'ek', 'i', 'iu', 'im', 'in', 'ing'] },
]

export const commonWords = [
  ['唔该', '唔該', 'm4 goi1', '谢谢；麻烦你', '唔该，冻柠茶少甜。'],
  ['多谢', '多謝', 'do1 ze6', '收到礼物时说谢谢', '多谢你送我返屋企。'],
  ['点呀', '點呀', 'dim2 aa3', '怎么样；最近好吗', '好耐冇见，点呀？'],
  ['冇问题', '冇問題', 'mou5 man6 tai4', '没问题', '听日交畀你，冇问题。'],
  ['几多钱', '幾多錢', 'gei2 do1 cin2', '多少钱', '呢个几多钱呀？'],
  ['我唔明', '我唔明', 'ngo5 m4 ming4', '我不明白', '唔好意思，我唔明。'],
]

export const dialogue = [
  { role: '店员', traditionalRole: '店員', text: '早晨，几位呀？', traditional: '早晨，幾位呀？', jyutping: 'zou2 san4, gei2 wai2 aa3?' },
  { role: '你', traditionalRole: '你', text: '一位，唔该。', traditional: '一位，唔該。', jyutping: 'jat1 wai2, m4 goi1.' },
  { role: '店员', traditionalRole: '店員', text: '想饮啲咩呀？', traditional: '想飲啲咩呀？', jyutping: 'soeng2 jam2 di1 me1 aa3?' },
  { role: '你', traditionalRole: '你', text: '一杯冻柠茶，少甜。', traditional: '一杯凍檸茶，少甜。', jyutping: 'jat1 bui1 dung3 ning4 caa4, siu2 tim4.' },
]

export function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}
