import { Bookmark, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { PageIntro } from '../components/SiteLayout'
import { commonWords } from '../data'
import { useApp } from '../state/AppContext'

export function WordsPage() {
  const { text } = useApp()
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const filtered = useMemo(() => commonWords.filter((word) => word.some((part) => part.includes(query))), [query])
  return <>
    <PageIntro eyebrow="100 EVERYDAY WORDS" title="常用 100 字词" traditionalTitle="常用 100 字詞" description="不是孤零零地背字。看粤拼、听发音，再把每个词放进香港日常会说的例句里。" />
    <section className="section compact-top"><div className="container">
      <div className="words-toolbar"><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={text('搜索字词、粤拼或意思', '搜尋字詞、粵拼或意思')} /></label><p><b>{filtered.length}</b> / 100 {text('个常用字词', '個常用字詞')}</p></div>
      <div className="word-list">{filtered.map(([simp, trad, jp, meaning, example], index) => <article className="word-row" key={simp}><span className="word-index">{String(index + 1).padStart(2, '0')}</span><div className="word-main"><h2>{text(simp, trad)}</h2><p>{jp}</p><AudioButton compact /></div><div className="word-meaning"><span>{text('白话意思', '白話意思')}</span><p>{text(meaning)}</p></div><div className="word-example"><span>{text('这样说', '這樣說')}</span><strong>{text(example)}</strong><AudioButton compact /></div><button className={saved.includes(simp) ? 'word-save saved' : 'word-save'} onClick={() => setSaved((current) => current.includes(simp) ? current.filter((x) => x !== simp) : [...current, simp])}><Bookmark fill={saved.includes(simp) ? 'currentColor' : 'none'} /></button></article>)}</div>
    </div></section>
  </>
}
