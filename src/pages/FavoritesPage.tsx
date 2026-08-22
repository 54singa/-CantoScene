import { Bookmark, Pause, Play, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PageIntro } from '../components/SiteLayout'
import { formatTime, videoStudies, type FavoriteLine } from '../data'
import { useApp } from '../state/AppContext'

export function FavoritesPage() {
  const { authReady, isLoggedIn, text, favorites, toggleFavorite } = useApp()
  const playerRef = useRef<HTMLAudioElement>(null)
  const activeLineRef = useRef<FavoriteLine | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playError, setPlayError] = useState('')

  useEffect(() => () => {
    const player = playerRef.current
    if (!player) return
    player.pause()
    player.removeAttribute('src')
    player.load()
  }, [])

  const stopPlayback = () => {
    playerRef.current?.pause()
    activeLineRef.current = null
    setPlayingId(null)
  }

  const playFavorite = (line: FavoriteLine) => {
    const player = playerRef.current
    if (!player) return
    setPlayError('')
    if (playingId === line.id && !player.paused) {
      stopPlayback()
      return
    }

    const video = videoStudies[line.videoSlug ?? 'cha-chaan-teng']
    if (!video) {
      setPlayError(text('找不到这句台词对应的视频。', '找不到這句台詞對應的影片。'))
      return
    }

    player.pause()
    activeLineRef.current = line
    setPlayingId(line.id)
    const seekToLine = () => { player.currentTime = line.start }
    player.src = video.videoUrl
    player.addEventListener('loadedmetadata', seekToLine, { once: true })
    player.load()
    void player.play().catch(() => {
      activeLineRef.current = null
      setPlayingId(null)
      setPlayError(text('这句暂时无法播放，请稍后重试。', '這句暫時無法播放，請稍後重試。'))
    })
  }

  const onPlayerTimeUpdate = () => {
    const player = playerRef.current
    const line = activeLineRef.current
    if (player && line && player.currentTime >= line.end) stopPlayback()
  }

  if (!authReady) return <div className="auth-loading">{text('正在读取收藏…', '正在讀取收藏…')}</div>
  if (!isLoggedIn) return <Navigate to="/login?next=/favorites" replace />
  return <>
    <PageIntro eyebrow="YOUR PHRASEBOOK" title="收藏夹" traditionalTitle="收藏夾" description="把遇见过的真实台词留在这里。多听几次，它们会慢慢变成你自己会说的话。" />
    <section className="section compact-top"><div className="container">
      <div className="favorites-summary"><div><Bookmark /><span><b>{favorites.length}</b><small>{text('句收藏台词', '句收藏台詞')}</small></span></div><p>{text('收藏已保存到你的粤见账号。', '收藏已儲存到你的粤見帳號。')}</p></div>
      <audio ref={playerRef} hidden preload="metadata" onTimeUpdate={onPlayerTimeUpdate} onEnded={stopPlayback} onError={stopPlayback} />
      {playError && <p className="favorite-play-error" role="alert">{playError}</p>}
      {favorites.length === 0 ? <div className="empty-state"><div className="empty-bookmark"><Bookmark /></div><h2>{text('你的句子本还是空的。', '你的句子本還是空的。')}</h2><p>{text('去看一段短片，点开喜欢的字幕，把第一句真实粤语带回来。', '去看一段短片，點開喜歡的字幕，把第一句真實粤語帶回來。')}</p><Link className="btn btn-primary" to="/watch/cha-chaan-teng"><Play fill="currentColor" />{text('开始听一段', '開始聽一段')}</Link></div> : <div className="favorite-list">{favorites.map((line) => {
        const isPlaying = playingId === line.id
        return <article key={line.id}><button className={`favorite-play${isPlaying ? ' is-playing' : ''}`} onClick={() => playFavorite(line)} aria-label={text(isPlaying ? '暂停这句' : '播放这句', isPlaying ? '暫停這句' : '播放這句')} title={text(isPlaying ? '暂停这句' : '播放这句', isPlaying ? '暫停這句' : '播放這句')}>{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><div className="favorite-copy"><small>{line.videoTitle} · {formatTime(line.start)}</small><h2>{text(line.yue, line.traditional)}</h2><p className="jyutping">{line.jyutping}</p><p>{line.mandarin}</p></div><Link className="btn btn-outline" to={`/watch/${line.videoSlug ?? 'cha-chaan-teng'}`}>{text('回到片段', '回到片段')}</Link><button className="delete-button" onClick={() => { if (playingId === line.id) stopPlayback(); void toggleFavorite(line) }} aria-label="移除收藏"><Trash2 /></button></article>
      })}</div>}
    </div></section>
  </>
}
