import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { Converter } from 'opencc-js/cn2t'
import type { FavoriteLine, Subtitle } from '../data'

type ScriptMode = 'simplified' | 'traditional'

type AppState = {
  script: ScriptMode
  setScript: (mode: ScriptMode) => void
  isLoggedIn: boolean
  setLoggedIn: (value: boolean) => void
  favorites: FavoriteLine[]
  toggleFavorite: (line: Subtitle, videoTitle?: string) => void
  isFavorite: (id: string) => boolean
  text: (simplified: string, traditional?: string) => string
}

const AppContext = createContext<AppState | null>(null)
const toHongKongTraditional = Converter({ from: 'cn', to: 'hk' })

function readFavorites(): FavoriteLine[] {
  try { return JSON.parse(localStorage.getItem('canto-favorites') ?? '[]') } catch { return [] }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [script, setScriptState] = useState<ScriptMode>(() => (localStorage.getItem('canto-script') as ScriptMode) || 'simplified')
  const [isLoggedIn, setLoggedInState] = useState(() => localStorage.getItem('canto-login') === 'true')
  const [favorites, setFavorites] = useState<FavoriteLine[]>(readFavorites)

  const setScript = (mode: ScriptMode) => {
    localStorage.setItem('canto-script', mode)
    setScriptState(mode)
  }
  const setLoggedIn = (value: boolean) => {
    localStorage.setItem('canto-login', String(value))
    setLoggedInState(value)
  }
  const toggleFavorite = (line: Subtitle, videoTitle = '第一次在茶餐厅点餐') => {
    setFavorites((current) => {
      const next = current.some((item) => item.id === line.id)
        ? current.filter((item) => item.id !== line.id)
        : [...current, { ...line, videoTitle, savedAt: new Date().toISOString() }]
      localStorage.setItem('canto-favorites', JSON.stringify(next))
      return next
    })
  }
  const value = useMemo<AppState>(() => ({
    script,
    setScript,
    isLoggedIn,
    setLoggedIn,
    favorites,
    toggleFavorite,
    isFavorite: (id) => favorites.some((item) => item.id === id),
    text: (simplified, traditional) => script === 'traditional' ? (traditional ?? toHongKongTraditional(simplified)) : simplified,
  }), [script, isLoggedIn, favorites])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
