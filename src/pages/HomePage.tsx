import { ArrowRight, Bookmark, Headphones, MessageCircleMore, MousePointer2, Play, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { courseUnits, videos } from '../data'
import { useApp } from '../state/AppContext'

export function HomePage() {
  const { text, isLoggedIn } = useApp()
  return <>
    <section className="hero">
      <div className="hero-shade" />
      <div className="hero-content">
        <span className="hero-kicker">HONG KONG CANTONESE · FOR BEGINNERS</span>
        <p className="hero-yue">粤见</p>
        <h1>CantoScene</h1>
        <p className="hero-slogan">{text('走进真实粤语。', '走進真實粵語。')}</p>
        <p className="hero-en">See it. Hear it. Get Cantonese.</p>
        <div className="hero-actions"><Link className="btn btn-primary" to="/watch/cha-chaan-teng"><Play size={18} fill="currentColor" />{text('开始听一段', '開始聽一段')}</Link><Link className="btn btn-glass" to="/courses">{text('看看课程', '看看課程')}<ArrowRight size={18} /></Link></div>
      </div>
      <div className="hero-scroll">SCROLL TO LEARN <span /></div>
    </section>

    <section className="section intro-section">
      <div className="container narrow centered">
        <span className="stamp stamp-peach">{text('从真实场景开始', '從真實場景開始')}</span>
        <h2>{text('不是背一门语言，是慢慢听懂一座城。', '不是背一門語言，是慢慢聽懂一座城。')}</h2>
        <p>{text('从茶餐厅、街市、小巴和一句“早晨”开始。先看见场景，再听懂声音，最后把粤语留在自己的日常里。', '從茶餐廳、街市、小巴和一句「早晨」開始。先看見場景，再聽懂聲音，最後把粵語留在自己的日常裡。')}</p>
      </div>
      <div className="container steps-grid">
        <div className="step-card"><span>01</span><Headphones /><h3>{text('先听', '先聽')}</h3><p>{text('听一遍完整场景，不急着逐字翻译。', '聽一遍完整場景，不急著逐字翻譯。')}</p></div>
        <div className="step-card step-card--offset"><span>02</span><MousePointer2 /><h3>{text('再点', '再點')}</h3><p>{text('点开不懂的字幕，看粤拼和普通话。', '點開不懂的字幕，看粵拼和普通話。')}</p></div>
        <div className="step-card"><span>03</span><Bookmark /><h3>{text('留下来', '留下來')}</h3><p>{text('收藏一句真实台词，之后随时回来复习。', '收藏一句真實台詞，之後隨時回來複習。')}</p></div>
      </div>
    </section>

    <section className="section subtitle-feature">
      <div className="container split-feature">
        <div className="feature-copy"><span className="eyebrow">LEARN FROM A LINE</span><h2>{text('一句字幕，藏着真实粤语的说法。', '一句字幕，藏著真實粵語的說法。')}</h2><p>{text('跟着播放进度读字幕。遇到不懂的，点一下就展开粤拼和普通话；想记住的，再收进自己的句子本。', '跟著播放進度讀字幕。遇到不懂的，點一下就展開粵拼和普通話；想記住的，再收進自己的句子本。')}</p><Link className="text-link" to="/watch/cha-chaan-teng">{text('试试影视学习', '試試影視學習')}<ArrowRight size={17} /></Link></div>
        <div className="paper-demo">
          <div className="tape" />
          <div className="demo-player"><div className="demo-play"><Play fill="currentColor" /></div><span>00:09 / 00:23</span><i><b /></i></div>
          <div className="demo-line active"><div><small>00:09</small><strong>{text('少甜吖，唔该。', '少甜吖，唔該。')}</strong></div><p>siu2 tim4 aa1, m4 goi1.</p><p>{text('少甜，谢谢。', '少甜，謝謝。')}</p></div>
          <div className="demo-line"><div><small>00:13</small><strong>{text('仲有冇其他嘢要呀？', '仲有冇其他嘢要呀？')}</strong></div></div>
          <div className="demo-save"><Bookmark size={16} /> {text('收藏这句', '收藏這句')}</div>
        </div>
      </div>
    </section>

    <section className="section courses-preview">
      <div className="container section-heading"><div><span className="eyebrow">SCENE COURSES</span><h2>{text('从今天会用的场景学起。', '從今天會用的場景學起。')}</h2></div><Link className="text-link" to="/courses">{text('全部课程', '全部課程')}<ArrowRight size={17} /></Link></div>
        <div className="container card-grid">{courseUnits.map((unit) => <Link className={`course-card tone-${unit.tone}`} to={`/lessons/${unit.id}-1`} key={unit.id}><span className="course-no">{unit.no}</span><span className="course-chip">{unit.lessons} LESSONS</span><h3>{text(unit.title, unit.traditional)}</h3><p>{text(unit.desc)}</p><div className="course-go"><ArrowRight /></div></Link>)}</div>
    </section>

    <section className="section video-preview">
      <div className="container section-heading"><div><span className="eyebrow">WATCH & LISTEN</span><h2>{text('把耳朵放进香港的日常。', '把耳朵放進香港的日常。')}</h2></div><Link className="text-link" to="/videos">{text('更多片段', '更多片段')}<ArrowRight size={17} /></Link></div>
      <div className="container video-grid">{videos.slice(0, 2).map((video) => <Link to={`/watch/${video.id}`} className="video-card" key={video.id}><div className="video-thumb" style={{ backgroundImage: `url(${video.image})` }}><span className="level-chip">{text(video.level)}</span><i><Play fill="currentColor" /></i></div><small>{text(video.eyebrow)}</small><h3>{text(video.title, video.traditional)}</h3><p>{text(video.desc)}</p></Link>)}</div>
    </section>

    <section className="join-strip"><Sparkles /><div><h2>{isLoggedIn ? text('继续走进真实粤语。', '繼續走進真實粵語。') : text('把听懂的每一句，都留下来。', '把聽懂的每一句，都留下來。')}</h2><p>{isLoggedIn ? text('你的课程进度和收藏句子都在这里。', '你的課程進度和收藏句子都在這裡。') : text('登录后保存进度、收藏台词，建立自己的粤语句子本。', '登入後保存進度、收藏台詞，建立自己的粵語句子本。')}</p></div><Link className="btn btn-ink" to={isLoggedIn ? '/my' : '/login'}>{isLoggedIn ? text('回到我的学习', '回到我的學習') : text('免费开始', '免費開始')}<MessageCircleMore size={17} /></Link></section>
  </>
}
