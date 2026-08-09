const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'http://127.0.0.1:3000/api/v1'

let accessToken: string | null = null
let refreshPromise: Promise<boolean> | null = null

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

type Envelope<T> = { data: T }
type ListEnvelope<T> = { data: T[] }

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null
  if (!response.ok) throw new ApiError(response.status, body?.error?.code ?? 'REQUEST_FAILED', body?.error?.message ?? '请求失败')
  return body as T
}

async function refreshAccess(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) return false
      const body = await parse<Envelope<{ access_token: string }>>(response)
      accessToken = body.data.access_token
      return true
    })
    .catch(() => false)
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = false, retried = false): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  if (authenticated && accessToken) headers.set('authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
  if (authenticated && response.status === 401 && !retried && await refreshAccess()) {
    return request<T>(path, init, true, true)
  }
  return parse<T>(response)
}

export type User = {
  id: string
  display_name: string
  script_preference: 'simplified' | 'traditional'
}

export type ApiSubtitle = {
  id: string
  video_id: string
  position: number
  start_ms: number
  end_ms: number
  text_simplified: string
  text_traditional: string
  jyutping: string | null
  mandarin_simplified: string | null
  mandarin_traditional: string | null
}

export type ApiFavorite = {
  id: string
  created_at: string
  subtitle_line: (ApiSubtitle & { video_slug: string }) | null
}

export type WordbookItem = {
  id: string
  term_simplified: string
  term_traditional: string
  jyutping: string | null
  mandarin_simplified: string | null
  example_simplified: string | null
  status: string
}

export type LearningSummary = {
  lessons_completed: number
  videos_started: number
  videos_completed: number
  favorites_learning: number
  wordbook_learning: number
  continue_learning: { type: 'video'; video_slug: string; current_ms: number } | null
}

type Session = { user: User; access_token: string }

export const api = {
  async restoreSession() {
    if (!await refreshAccess()) return null
    return (await request<Envelope<User>>('/me', {}, true)).data
  },
  async login(email: string, password: string) {
    const result = (await request<Envelope<Session>>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })).data
    accessToken = result.access_token
    return result.user
  },
  async register(email: string, password: string, displayName: string) {
    const result = (await request<Envelope<Session>>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, display_name: displayName }) })).data
    accessToken = result.access_token
    return result.user
  },
  async logout() {
    try { await request<void>('/auth/logout', { method: 'POST' }) } finally { accessToken = null }
  },
  async updateScript(script_preference: User['script_preference']) {
    return (await request<Envelope<User>>('/me/preferences', { method: 'PATCH', body: JSON.stringify({ script_preference }) }, true)).data
  },
  async getVideo(slug: string) {
    return (await request<Envelope<{ id: string; slug: string; title_simplified: string; title_traditional: string }>>(`/videos/${slug}`)).data
  },
  async getSubtitles(videoId: string) {
    return (await request<ListEnvelope<ApiSubtitle>>(`/videos/${videoId}/subtitles?limit=500`)).data
  },
  async getFavorites() { return (await request<ListEnvelope<ApiFavorite>>('/me/favorites?kind=subtitle_line&limit=50', {}, true)).data },
  async addFavorite(subtitleId: string) { return (await request<Envelope<ApiFavorite>>(`/me/favorites/subtitles/${subtitleId}`, { method: 'PUT' }, true)).data },
  async deleteFavorite(id: string) { return request<void>(`/me/favorites/${id}`, { method: 'DELETE' }, true) },
  async getWordbook() { return (await request<ListEnvelope<WordbookItem>>('/me/wordbook', {}, true)).data },
  async addWord(input: { term_simplified: string; term_traditional: string; jyutping: string; mandarin_simplified: string; example_simplified: string }) {
    await request('/me/wordbook', { method: 'POST', body: JSON.stringify(input) }, true)
  },
  async deleteWord(id: string) { return request<void>(`/me/wordbook/${id}`, { method: 'DELETE' }, true) },
  async getSummary() { return (await request<Envelope<LearningSummary>>('/me/learning-summary', {}, true)).data },
  async saveVideoProgress(videoId: string, currentMs: number, status: 'in_progress' | 'completed' = 'in_progress') {
    return request(`/me/video-progress/${videoId}`, { method: 'PUT', body: JSON.stringify({ status, current_ms: currentMs }) }, true)
  },
}
