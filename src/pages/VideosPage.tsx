import { Clock3, Play, Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/SiteLayout'
import { videos } from '../data'
import { useApp } from '../state/AppContext'

export function VideosPage() {
  const { text } = useApp()
  return <>
    <PageIntro eyebrow="WATCH & LISTEN" title="影视学习" traditionalTitle="影視學習" description="看见场景，听见语气。用短片里的真实对白练习香港日常粤语。" />
    <section className="section compact-top"><div className="container">
      <div className="filter-bar"><label><Search size={18} /><input placeholder={text('搜索片段或场景', '搜尋片段或場景')} /></label><div className="filter-chips"><button className="active">{text('全部', '全部')}</button><button>{text('日常', '日常')}</button><button>{text('饮食', '飲食')}</button><button>{text('交通', '交通')}</button><button><SlidersHorizontal size={15} />{text('筛选', '篩選')}</button></div></div>
      <div className="catalog-grid">{videos.map((video, index) => <Link to={`/watch/${video.id}`} className="catalog-video" key={video.id}><div className="catalog-thumb" style={{ backgroundImage: `url(${video.image})` }}><span className="level-chip">{text(video.level)}</span><span className="duration"><Clock3 size={13} />0:{index === 0 ? '23' : index === 1 ? '35' : '42'}</span><i><Play fill="currentColor" /></i></div><div className="catalog-copy"><small>{text(video.eyebrow)}</small><h2>{text(video.title, video.traditional)}</h2><p>{text(video.desc)}</p><span className="learn-label">{text('进入学习', '進入學習')} →</span></div></Link>)}</div>
    </div></section>
  </>
}
