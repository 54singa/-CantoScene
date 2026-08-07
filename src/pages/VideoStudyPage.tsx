import { Bookmark, BookmarkCheck, ChevronLeft, Gauge, Maximize, Pause, Play, RotateCcw, RotateCw, Settings, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTime, subtitles } from '../data'
import { useApp } from '../state/AppContext'

const duration = 23.5

export function VideoStudyPage() {
  const { text, toggleFavorite, isFavorite } = useApp()
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedId, setSelectedId] = useState('line-1')
  const timer = useRef<number | null>(null)
  const active = useMemo(() => subtitles.find((line) => time >= line.start && time < line.end) ?? subtitles.at(-1)!, [time])
  const selected = subtitles.find((line) => line.id === selectedId) ?? active

  useEffect(() => {
    if (playing) {
      timer.current = window.setInterval(() => setTime((current) => {
        if (current >= duration) { setPlaying(false); return 0 }
        return Math.min(duration, current + 0.1)
      }), 100)
    }
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [playing])

  useEffect(() => {
    if (playing) setSelectedId(active.id)
  }, [active.id, playing])

  const seek = (next: number) => setTime(Math.min(duration, Math.max(0, next)))
  const selectLine = (id: string, start: number) => { setSelectedId(id); seek(start) }

  return <div className="study-page">
    <div className="study-topbar"><Link to="/videos"><ChevronLeft />{text('返回影视学习', '返回影視學習')}</Link><div><span>{text('第一次在茶餐厅点餐', '第一次在茶餐廳點餐')}</span><small>茶餐厅 · 入门</small></div><span className="study-status"><i />{text('学习中', '學習中')}</span></div>
    <div className="study-layout">
      <section className="study-stage">
        <div className="video-simulation" onClick={() => setPlaying((v) => !v)}>
          <img src="/design/assets/city-street.png" alt="香港街头场景占位图" />
          <div className="video-vignette" />
          <span className="simulation-label">DEMO SCENE · VIDEO PLACEHOLDER</span>
          <div className="screen-subtitle"><strong>{text(active.yue, active.traditional)}</strong><span>{active.jyutping}</span></div>
          {!playing && <button className="center-play" aria-label="播放"><Play fill="currentColor" /></button>}
        </div>
        <div className="player-controls">
          <input className="progress-input" type="range" min="0" max={duration} step="0.1" value={time} onChange={(e) => seek(Number(e.target.value))} style={{ '--progress': `${time / duration * 100}%` } as React.CSSProperties} aria-label="播放进度" />
          <div className="control-row">
            <div><button onClick={() => seek(time - 5)} aria-label="后退五秒"><RotateCcw /></button><button className="primary-control" onClick={() => setPlaying((v) => !v)} aria-label={playing ? '暂停' : '播放'}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><button onClick={() => seek(time + 5)} aria-label="前进五秒"><RotateCw /></button><span>{formatTime(time)} / {formatTime(duration)}</span></div>
            <div><button aria-label="音量"><Volume2 /></button><button aria-label="播放速度"><Gauge /></button><button aria-label="设置"><Settings /></button><button aria-label="全屏"><Maximize /></button></div>
          </div>
        </div>
        <div className="selected-line-card">
          <span className="eyebrow">CURRENT LINE</span>
          <div className="selected-main"><div><h2>{text(selected.yue, selected.traditional)}</h2><p className="jyutping">{selected.jyutping}</p><p>{selected.mandarin}</p></div><button className={isFavorite(selected.id) ? 'save-line saved' : 'save-line'} onClick={() => toggleFavorite(selected)}>{isFavorite(selected.id) ? <BookmarkCheck /> : <Bookmark />}{isFavorite(selected.id) ? text('已收藏', '已收藏') : text('收藏这句', '收藏這句')}</button></div>
          <button className="replay-line" onClick={() => { seek(selected.start); setPlaying(true) }}><Play size={15} fill="currentColor" />{text('重播这一句', '重播這一句')}</button>
        </div>
      </section>

      <aside className="transcript-panel">
        <div className="transcript-head"><div><span className="eyebrow">TRANSCRIPT</span><h2>{text('跟读字幕', '跟讀字幕')}</h2></div><span>{subtitles.length} LINES</span></div>
        <p className="transcript-tip">{text('点击任意一句，视频会跳到对应位置。', '點擊任意一句，影片會跳到對應位置。')}</p>
        <div className="transcript-list">{subtitles.map((line) => {
          const expanded = line.id === selectedId
          const current = line.id === active.id
          return <article key={line.id} className={`transcript-line ${current ? 'is-current' : ''} ${expanded ? 'is-expanded' : ''}`} onClick={() => selectLine(line.id, line.start)}>
            <button className="line-time">{formatTime(line.start)}</button>
            <div className="line-content"><strong>{text(line.yue, line.traditional)}</strong>{expanded && <div className="line-details"><p>{line.jyutping}</p><p>{line.mandarin}</p><div><button onClick={(e) => { e.stopPropagation(); seek(line.start); setPlaying(true) }}><Play size={14} fill="currentColor" />{text('播放', '播放')}</button><button className={isFavorite(line.id) ? 'is-saved' : ''} onClick={(e) => { e.stopPropagation(); toggleFavorite(line) }}>{isFavorite(line.id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{isFavorite(line.id) ? text('已收藏', '已收藏') : text('收藏', '收藏')}</button></div></div>}</div>
          </article>
        })}</div>
      </aside>
    </div>
  </div>
}
