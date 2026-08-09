import { ArrowRight, Bookmark, Check, Film, GraduationCap } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useApp } from '../state/AppContext'

export function LoginPage() {
  const { authReady, isLoggedIn, login, register, text } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const next = new URLSearchParams(location.search).get('next') || '/my'

  if (!authReady) return <div className="auth-loading">{text('正在检查登录状态…', '正在檢查登入狀態…')}</div>
  if (isLoggedIn) return <Navigate to={next} replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'register') await register(email, password, name)
      else await login(email, password)
      navigate(next, { replace: true })
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : text('无法连接服务，请确认后端已启动。', '無法連接服務，請確認後端已啟動。'))
    } finally { setBusy(false) }
  }

  return <div className="login-page">
    <div className="login-art"><div className="login-art-copy"><span className="stamp stamp-butter">CANTOSCENE</span><h1>{text('把听懂的每一句，都留下来。', '把聽懂的每一句，都留下來。')}</h1><p>See it. Hear it. Get Cantonese.</p><div><span><Film />{text('继续影视学习', '繼續影視學習')}</span><span><Bookmark />{text('保存收藏台词', '儲存收藏台詞')}</span><span><GraduationCap />{text('记录课程进度', '記錄課程進度')}</span></div></div></div>
    <form className="login-card" onSubmit={submit}>
      <span className="eyebrow">WELCOME TO 粤见</span>
      <h2>{mode === 'login' ? text('欢迎回来。', '歡迎回來。') : text('创建你的学习账号。', '建立你的學習帳號。')}</h2>
      <p>{text('收藏、生词本和学习进度会保存到你的账号。', '收藏、生詞本和學習進度會儲存到你的帳號。')}</p>
      <div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>{text('登录', '登入')}</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>{text('注册', '註冊')}</button></div>
      {mode === 'register' && <label>{text('昵称', '暱稱')}<input required value={name} onChange={(event) => setName(event.target.value)} placeholder={text('例如：阿晴', '例如：阿晴')} /></label>}
      <label>{text('邮箱', '電郵')}<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
      <label>{text('密码（至少 8 位）', '密碼（至少 8 位）')}<input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? text('请稍候…', '請稍候…') : mode === 'login' ? text('进入粤见', '進入粤見') : text('注册并开始', '註冊並開始')}<ArrowRight /></button>
      <small><Check />{text('登录后可在不同页面继续同一份学习记录', '登入後可在不同頁面繼續同一份學習記錄')}</small>
    </form>
  </div>
}
