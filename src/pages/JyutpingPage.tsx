import { AudioLines, Info, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { PageIntro } from '../components/SiteLayout'
import { jyutpingGroups } from '../data'
import { useApp } from '../state/AppContext'

export function JyutpingPage() {
  const { text } = useApp()
  const [active, setActive] = useState('b')
  return <>
    <PageIntro eyebrow="JYUTPING GUIDE" title="粤拼发音" traditionalTitle="粵拼發音" description="把粤语的声音拆开来看。点击声母、韵母和声调，认识它们在真实字词里的发音。" />
    <section className="section compact-top"><div className="container pronunciation-layout">
      <div className="sound-groups">{jyutpingGroups.map((group) => <section key={group.title}><div className="sound-heading"><div><span className="eyebrow">{group.title === '声母' ? 'INITIALS' : 'FINALS'}</span><h2>{text(group.title, group.traditional)}</h2></div><p>{group.desc}</p></div><div className="sound-grid">{group.items.map((item) => <button className={active === item ? 'active' : ''} key={item} onClick={() => setActive(item)}>{item}</button>)}</div></section>)}</div>
      <aside className="sound-detail"><div className="tape" /><span className="eyebrow">SOUND CARD</span><div className="sound-symbol">{active}</div><button className="round-audio"><Volume2 fill="currentColor" /></button><p>{text('点击播放示范音', '點擊播放示範音')}</p><hr /><span className="example-label">{text('例字', '例字')}</span><h2>{active === 'b' ? '杯' : active === 'aa' ? '茶' : '见'}</h2><p className="jyutping">{active === 'b' ? 'bui1' : active === 'aa' ? 'caa4' : 'gin3'}</p><p>{active === 'b' ? '一杯冻柠茶' : '在真实词语里听见这个音'}</p><div className="tip-box"><Info />{text('先听例字，再跟着口形轻声模仿。正式音频将在内容制作阶段接入。', '先聽例字，再跟著口形輕聲模仿。正式音頻將在內容製作階段接入。')}</div></aside>
    </div><div className="container tone-section"><div className="sound-heading"><div><span className="eyebrow">TONES</span><h2>{text('六个声调', '六個聲調')}</h2></div><p>{text('同一个音节，声调不同，意思就会改变。', '同一個音節，聲調不同，意思就會改變。')}</p></div><div className="tone-grid">{['高平 1', '高升 2', '中平 3', '低降 4', '低升 5', '低平 6'].map((tone, i) => <button key={tone}><AudioLines /><b>{i + 1}</b><span>{tone}</span><small>si{i + 1}</small></button>)}</div></div></section>
  </>
}
