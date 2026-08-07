import { ArrowRight, Bookmark, Check, Film, GraduationCap } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'

export function LoginPage() {
  const { isLoggedIn, setLoggedIn, text } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  if (isLoggedIn) return <Navigate to="/my" replace />
  const submit = (e: FormEvent) => { e.preventDefault(); setLoggedIn(true); navigate('/my') }
  return <div className="login-page"><div className="login-art"><div className="login-art-copy"><span className="stamp stamp-butter">CANTOSCENE</span><h1>{text('把听懂的每一句，都留下来。', '把聽懂的每一句，都留下來。')}</h1><p>See it. Hear it. Get Cantonese.</p><div><span><Film />{text('继续影视学习', '繼續影視學習')}</span><span><Bookmark />{text('保存收藏台词', '儲存收藏台詞')}</span><span><GraduationCap />{text('记录课程进度', '記錄課程進度')}</span></div></div></div><form className="login-card" onSubmit={submit}><span className="eyebrow">WELCOME TO 粤见</span><h2>{text('先用一个昵称开始。', '先用一個暱稱開始。')}</h2><p>{text('MVP 阶段为本地演示登录，不需要密码。', 'MVP 階段為本地示範登入，不需要密碼。')}</p><label>{text('你的昵称', '你的暱稱')}<input required value={name} onChange={(e) => setName(e.target.value)} placeholder={text('例如：阿晴', '例如：阿晴')} /></label><button className="btn btn-primary" type="submit">{text('进入粤见', '進入粵見')}<ArrowRight /></button><small><Check />{text('昵称和学习数据仅保存在此浏览器', '暱稱和學習資料僅保存在此瀏覽器')}</small></form></div>
}
