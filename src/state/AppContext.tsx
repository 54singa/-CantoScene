import { Converter } from 'opencc-js/cn2t'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError, api, type ApiFavorite, type ApiSubtitle, type LearningSummary, type User, type WordbookItem } from '../api/client'
import type { FavoriteLine, Subtitle } from '../data'

type ScriptMode = 'simplified' | 'traditional'

type WordInput = { simplified: string; traditional: string; jyutping: string; meaning: string; example: string }

type AppState = {
  script: ScriptMode
  setScript: (mode: ScriptMode) => void
  authReady: boolean
  isLoggedIn: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  favorites: FavoriteLine[]
  toggleFavorite: (line: Subtitle, videoTitle?: string) => Promise<boolean>
  isFavorite: (id: string) => boolean
  wordbook: WordbookItem[]
  toggleWord: (word: WordInput) => Promise<boolean>
  isWordSaved: (simplified: string) => boolean
  summary: LearningSummary | null
  recordVideoProgress: (slug: string, seconds: number, completed?: boolean) => Promise<void>
  text: (simplified: string, traditional?: string) => string
}

const AppContext = createContext<AppState | null>(null)
const toHongKongTraditional = Converter({ from: 'cn', to: 'hk' })

function readLegacyFavorites(): FavoriteLine[] {
  try { return JSON.parse(localStorage.getItem('canto-favorites') ?? '[]') } catch { return [] }
}

function linePosition(id: string) {
  const match = id.match(/^line-(\d+)$/)
  return match ? Number(match[1]) : undefined
}

function favoriteLine(item: ApiFavorite): FavoriteLine | null {
  const line = item.subtitle_line
  if (!line) return null
  return {
    id: `line-${line.position}`,
    serverId: item.id,
    videoId: line.video_id,
    videoSlug: line.video_slug,
    start: line.start_ms / 1000,
    end: line.end_ms / 1000,
    yue: line.text_simplified,
    traditional: line.text_traditional,
    jyutping: line.jyutping ?? 'Jyutping 待校对后生成',
    mandarin: line.mandarin_simplified ?? '普通话释义待校对。',
    videoTitle: '粤语对白练习',
    savedAt: item.created_at,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [script, setScriptState] = useState<ScriptMode>(() => (localStorage.getItem('canto-script') as ScriptMode) || 'simplified')
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [favorites, setFavorites] = useState<FavoriteLine[]>([])
  const [wordbook, setWordbook] = useState<WordbookItem[]>([])
  const [summary, setSummary] = useState<LearningSummary | null>(null)
  const favoritesRef = useRef<FavoriteLine[]>([])
  const wordbookRef = useRef<WordbookItem[]>([])
  const catalogRef = useRef<{ videoId: string; lines: ApiSubtitle[] } | null>(null)
  const catalogPromiseRef = useRef<Promise<{ videoId: string; lines: ApiSubtitle[] }> | null>(null)
  const legacyFavorites = useRef(readLegacyFavorites())

  const loadCatalog = useCallback(async () => {
    if (catalogRef.current) return catalogRef.current
    if (!catalogPromiseRef.current) {
      catalogPromiseRef.current = api.getVideo('cha-chaan-teng').then(async (video) => {
        const catalog = { videoId: video.id, lines: await api.getSubtitles(video.id) }
        catalogRef.current = catalog
        return catalog
      }).finally(() => { catalogPromiseRef.current = null })
    }
    return catalogPromiseRef.current
  }, [])

  const refreshPrivateData = useCallback(async () => {
    const [favoriteItems, wordItems, learningSummary] = await Promise.all([
      api.getFavorites(), api.getWordbook(), api.getSummary(),
    ])
    const nextFavorites = favoriteItems.map(favoriteLine).filter((item): item is FavoriteLine => Boolean(item))
    favoritesRef.current = nextFavorites
    wordbookRef.current = wordItems
    setFavorites(nextFavorites)
    setWordbook(wordItems)
    setSummary(learningSummary)
  }, [])

  const migrateLegacyFavorites = useCallback(async () => {
    if (!legacyFavorites.current.length) return
    const catalog = await loadCatalog()
    for (const legacy of legacyFavorites.current) {
      const position = linePosition(legacy.id)
      const serverLine = catalog.lines.find((line) => line.position === position)
      if (serverLine) await api.addFavorite(serverLine.id)
    }
    legacyFavorites.current = []
    localStorage.removeItem('canto-favorites')
    localStorage.removeItem('canto-login')
  }, [loadCatalog])

  const finishAuthentication = useCallback(async (nextUser: User) => {
    setUser(nextUser)
    setScriptState(nextUser.script_preference)
    localStorage.setItem('canto-script', nextUser.script_preference)
    await migrateLegacyFavorites().catch(() => undefined)
    await refreshPrivateData()
  }, [migrateLegacyFavorites, refreshPrivateData])

  useEffect(() => {
    let active = true
    api.restoreSession()
      .then(async (restoredUser) => {
        if (!active || !restoredUser) return
        await finishAuthentication(restoredUser)
      })
      .catch(() => undefined)
      .finally(() => { if (active) setAuthReady(true) })
    return () => { active = false }
  }, [finishAuthentication])

  const setScript = useCallback((mode: ScriptMode) => {
    localStorage.setItem('canto-script', mode)
    setScriptState(mode)
    if (user) void api.updateScript(mode).catch(() => undefined)
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    await finishAuthentication(await api.login(email, password))
  }, [finishAuthentication])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    await finishAuthentication(await api.register(email, password, displayName))
  }, [finishAuthentication])

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined)
    setUser(null)
    favoritesRef.current = []
    wordbookRef.current = []
    setFavorites([])
    setWordbook([])
    setSummary(null)
    localStorage.removeItem('canto-login')
  }, [])

  const toggleFavorite = useCallback(async (line: Subtitle) => {
    if (!user) return false
    const existing = favoritesRef.current.find((item) => item.id === line.id)
    if (existing?.serverId) {
      await api.deleteFavorite(existing.serverId)
      favoritesRef.current = favoritesRef.current.filter((item) => item.id !== line.id)
      setFavorites(favoritesRef.current)
      return true
    }
    const catalog = await loadCatalog()
    const position = linePosition(line.id)
    const serverLine = catalog.lines.find((item) => item.position === position)
      ?? catalog.lines.find((item) => Math.abs(item.start_ms / 1000 - line.start) < 0.05)
    if (!serverLine) throw new ApiError(404, 'SUBTITLE_NOT_FOUND', '找不到这句字幕')
    const saved = favoriteLine(await api.addFavorite(serverLine.id))
    if (saved) {
      favoritesRef.current = [saved, ...favoritesRef.current.filter((item) => item.id !== saved.id)]
      setFavorites(favoritesRef.current)
    }
    return true
  }, [loadCatalog, user])

  const toggleWord = useCallback(async (word: WordInput) => {
    if (!user) return false
    const existing = wordbookRef.current.find((item) => item.term_simplified === word.simplified)
    if (existing) {
      await api.deleteWord(existing.id)
      wordbookRef.current = wordbookRef.current.filter((item) => item.id !== existing.id)
      setWordbook(wordbookRef.current)
    } else {
      await api.addWord({
        term_simplified: word.simplified,
        term_traditional: word.traditional,
        jyutping: word.jyutping,
        mandarin_simplified: word.meaning,
        example_simplified: word.example,
      })
      wordbookRef.current = await api.getWordbook()
      setWordbook(wordbookRef.current)
    }
    setSummary(await api.getSummary())
    return true
  }, [user])

  const recordVideoProgress = useCallback(async (slug: string, seconds: number, completed = false) => {
    if (!user) return
    try {
      const catalog = slug === 'cha-chaan-teng' ? await loadCatalog() : { videoId: (await api.getVideo(slug)).id }
      await api.saveVideoProgress(catalog.videoId, Math.max(0, Math.round(seconds * 1000)), completed ? 'completed' : 'in_progress')
      setSummary(await api.getSummary())
    } catch { /* 进度同步失败不应中断播放 */ }
  }, [loadCatalog, user])

  const isFavorite = useCallback((id: string) => favoritesRef.current.some((item) => item.id === id), [])
  const isWordSaved = useCallback((simplified: string) => wordbookRef.current.some((item) => item.term_simplified === simplified), [])

  const value = useMemo<AppState>(() => ({
    script,
    setScript,
    authReady,
    isLoggedIn: Boolean(user),
    user,
    login,
    register,
    logout,
    favorites,
    toggleFavorite,
    isFavorite,
    wordbook,
    toggleWord,
    isWordSaved,
    summary,
    recordVideoProgress,
    text: (simplified, traditional) => script === 'traditional' ? (traditional ?? toHongKongTraditional(simplified)) : simplified,
  }), [authReady, favorites, isFavorite, isWordSaved, login, logout, recordVideoProgress, register, script, setScript, summary, toggleFavorite, toggleWord, user, wordbook])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
