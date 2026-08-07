import { ArrowLeft, ArrowRight, BookOpenCheck, Check, MessageCircleMore, Play } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { commonWords, dialogue } from '../data'
import { useApp } from '../state/AppContext'

export function LessonPage() {
  const { text } = useApp()
  const [done, setDone] = useState(false)
  return <div className="lesson-page">
    <div className="lesson-hero"><div className="container"><Link to="/courses" className="back-link"><ArrowLeft />{text('返回课程', '返回課程')}</Link><span className="stamp stamp-peach">UNIT 01 · LESSON 01</span><h1>{text('在茶餐厅坐低', '在茶餐廳坐低')}</h1><p>{text('先学会打招呼、说人数，再点一杯最经典的冻柠茶。', '先學會打招呼、說人數，再點一杯最經典的凍檸茶。')}</p><div className="lesson-meta"><span>约 8 分钟</span><span>4 个重点表达</span><span>1 段场景对话</span></div></div></div>
    <div className="container lesson-layout">
      <aside className="lesson-outline"><span className="eyebrow">THIS LESSON</span><a href="#listen">01 先听场景</a><a href="#words">02 重点表达</a><a href="#dialogue">03 完整对话</a><a href="#finish">04 完成本课</a></aside>
      <div className="lesson-content">
        <section id="listen" className="lesson-block"><span className="block-no">01</span><div><span className="eyebrow">LISTEN FIRST</span><h2>{text('先听一遍，不看解释。', '先聽一遍，不看解釋。')}</h2><p>{text('想象你刚走进一间茶餐厅。先感受语速和语气，再往下拆解。', '想像你剛走進一間茶餐廳。先感受語速和語氣，再往下拆解。')}</p><button className="scene-audio"><i><Play fill="currentColor" /></i><span><b>茶餐厅 · 入座与点饮品</b><small>00:36 · 场景音频占位</small></span></button></div></section>
        <section id="words" className="lesson-block"><span className="block-no">02</span><div><span className="eyebrow">KEY PHRASES</span><h2>{text('这一课，先记住四句。', '這一課，先記住四句。')}</h2><div className="phrase-list">{commonWords.slice(0, 4).map(([simp, trad, jp, meaning], index) => <article key={simp}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{text(simp, trad)}</h3><p className="jyutping">{jp}</p><p>{meaning}</p></div><AudioButton compact /></article>)}</div></div></section>
        <section id="dialogue" className="lesson-block"><span className="block-no">03</span><div><span className="eyebrow">FULL DIALOGUE</span><h2>{text('把表达放回真实对话里。', '把表達放回真實對話裡。')}</h2><div className="dialogue-card"><div className="tape" />{dialogue.map((line) => <div className="dialogue-line" key={line.text}><span>{text(line.role, line.traditionalRole)}</span><div><strong>{text(line.text, line.traditional)}</strong><p>{line.jyutping}</p></div><AudioButton compact /></div>)}</div><Link className="text-link" to="/watch/cha-chaan-teng"><Play size={15} fill="currentColor" />{text('去短片里再听一次', '去短片裡再聽一次')}</Link></div></section>
        <section id="finish" className="finish-card"><BookOpenCheck /><div><h2>{done ? text('这一课已经留下来了。', '這一課已經留下來了。') : text('听懂了吗？完成这一课。', '聽懂了嗎？完成這一課。')}</h2><p>{text('进度会保存在这台设备上，之后可以从这里继续。', '進度會保存在這台裝置上，之後可以從這裡繼續。')}</p></div><button className={done ? 'btn btn-green' : 'btn btn-primary'} onClick={() => setDone((v) => !v)}>{done ? <><Check />{text('已完成', '已完成')}</> : <>{text('完成本课', '完成本課')}<ArrowRight /></>}</button></section>
      </div>
    </div>
  </div>
}
