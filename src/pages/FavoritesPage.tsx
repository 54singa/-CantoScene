import { Bookmark, Play, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/SiteLayout'
import { formatTime } from '../data'
import { useApp } from '../state/AppContext'

export function FavoritesPage() {
  const { text, favorites, toggleFavorite } = useApp()
  return <>
    <PageIntro eyebrow="YOUR PHRASEBOOK" title="收藏夹" traditionalTitle="收藏夾" description="把遇见过的真实台词留在这里。多听几次，它们会慢慢变成你自己会说的话。" />
    <section className="section compact-top"><div className="container">
      <div className="favorites-summary"><div><Bookmark /><span><b>{favorites.length}</b><small>{text('句收藏台词', '句收藏台詞')}</small></span></div><p>{text('收藏会保存在当前浏览器中。登录与云端同步将在后端阶段接入。', '收藏會保存在目前瀏覽器中。登入與雲端同步將在後端階段接入。')}</p></div>
      {favorites.length === 0 ? <div className="empty-state"><div className="empty-bookmark"><Bookmark /></div><h2>{text('你的句子本还是空的。', '你的句子本還是空的。')}</h2><p>{text('去看一段短片，点开喜欢的字幕，把第一句真实粤语带回来。', '去看一段短片，點開喜歡的字幕，把第一句真實粵語帶回來。')}</p><Link className="btn btn-primary" to="/watch/cha-chaan-teng"><Play fill="currentColor" />{text('开始听一段', '開始聽一段')}</Link></div> : <div className="favorite-list">{favorites.map((line) => <article key={line.id}><button className="favorite-play"><Play fill="currentColor" /></button><div className="favorite-copy"><small>{line.videoTitle} · {formatTime(line.start)}</small><h2>{text(line.yue, line.traditional)}</h2><p className="jyutping">{line.jyutping}</p><p>{line.mandarin}</p></div><Link className="btn btn-outline" to="/watch/cha-chaan-teng">{text('回到片段', '回到片段')}</Link><button className="delete-button" onClick={() => toggleFavorite(line)} aria-label="移除收藏"><Trash2 /></button></article>)}</div>}
    </div></section>
  </>
}
