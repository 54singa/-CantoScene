import { Converter } from 'opencc-js/cn2t'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import sharedCss from '../../design/mockup/css/site.css?raw'
import { formatTime, video01Subtitles } from '../data'
import { toggleAudio } from '../lib/audio'
import { useApp } from '../state/AppContext'

const toHongKongTraditional = Converter({ from: 'cn', to: 'hk' })

function extract(source: string, tag: 'style' | 'body') {
  const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match?.[1] ?? ''
}

function prepareMarkup(source: string) {
  return extract(source, 'body')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replaceAll('../assets/', '/design/assets/')
    .replaceAll('href="home.html"', 'href="/"')
    .replaceAll('href="courses.html"', 'href="/courses"')
    .replaceAll('href="lesson.html"', 'href="/lessons/restaurant-1"')
    .replaceAll('href="videos.html"', 'href="/videos"')
    .replaceAll('href="video-study.html"', 'href="/watch/cha-chaan-teng"')
    .replaceAll('href="favorites.html"', 'href="/favorites"')
    .replaceAll('href="my.html"', 'href="/my"')
}

function isolateCss(css: string) {
  return css
    .replaceAll(':root', ':host')
    .replace(/(^|\})\s*html\s*\{/g, '$1\n:host{')
    .replace(/(^|\})\s*body\s*\{/g, '$1\n.prototype-body{')
}

const navRoutes: Record<string, string> = {
  '首页': '/',
  '首頁': '/',
  '基础课程': '/courses',
  '基礎課程': '/courses',
  '影视学粤语': '/videos',
  '影視學粵語': '/videos',
  '收藏': '/favorites',
  '我的学习': '/my',
  '我的學習': '/my',
  '登录': '/login',
  '登入': '/login',
  '登录 / 注册': '/login',
  '登入 / 註冊': '/login',
  '返回影视列表': '/videos',
  '返回影視列表': '/videos',
}

export function PrototypePage({ source, pageId }: { source: string; pageId: string }) {
  const root = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { script, setScript, isLoggedIn, user, toggleFavorite, isFavorite, recordVideoProgress } = useApp()
  const pageCss = useMemo(() => extract(source, 'style'), [source])
  const markup = useMemo(() => {
    const prepared = prepareMarkup(source)
    return script === 'traditional' ? toHongKongTraditional(prepared) : prepared
  }, [source, script])

  useEffect(() => {
    const host = root.current
    if (!host) return
    const scope = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    const baseCss = pageId === 'home' ? '' : isolateCss(sharedCss)
    scope.innerHTML = `<style>${baseCss}\n${isolateCss(pageCss)}</style><div class="prototype-body">${markup}</div>`
    window.scrollTo(0, 0)
    const nav = scope.querySelector<HTMLElement>('.nav')
    const loginButton = scope.querySelector<HTMLAnchorElement>('.login-btn')
    if (loginButton && isLoggedIn) {
      loginButton.textContent = user?.display_name ?? (script === 'traditional' ? '我的學習' : '我的学习')
      loginButton.setAttribute('href', '/my')
    }
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40)
    const onClick = (event: Event) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a')
      const language = (event.target as HTMLElement).closest<HTMLElement>('.lang')
      if (language) {
        event.preventDefault()
        setScript(script === 'simplified' ? 'traditional' : 'simplified')
        return
      }
      if (!anchor) return
      const label = anchor.textContent?.trim().replace(/\s+/g, ' ') ?? ''
      const href = anchor.getAttribute('href') ?? ''
      if (href.startsWith('#') && href.length > 1) {
        event.preventDefault()
        scope.querySelector<HTMLElement>(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      const target = navRoutes[label] ?? (href.startsWith('/') ? href : '')
      if (target) {
        event.preventDefault()
        navigate(target)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    scope.addEventListener('click', onClick)

    const tabs = [...scope.querySelectorAll<HTMLElement>('.tab[data-g]')]
    const onTabClick = (event: Event) => {
      const tab = event.currentTarget as HTMLElement
      scope.querySelectorAll('.tab,.group').forEach((element) => element.classList.remove('on'))
      tab.classList.add('on')
      scope.querySelector<HTMLElement>(`#${tab.dataset.g}`)?.classList.add('on')
    }
    tabs.forEach((tab) => tab.addEventListener('click', onTabClick))

    const filters = [...scope.querySelectorAll<HTMLElement>('.f-chip')]
    const onFilterClick = (event: Event) => {
      filters.forEach((filter) => filter.classList.remove('on'))
      ;(event.currentTarget as HTMLElement).classList.add('on')
    }
    filters.forEach((filter) => filter.addEventListener('click', onFilterClick))

    const lessonAudioButtons = pageId === 'lesson'
      ? [...scope.querySelectorAll<HTMLElement>('[data-audio-src]')]
      : []
    const lessonAudioHandlers = lessonAudioButtons.map((button) => () => {
      const source = button.dataset.audioSrc
      if (!source) return
      toggleAudio(source, (playing) => {
        button.classList.toggle('is-playing', playing)
        button.setAttribute('aria-pressed', String(playing))
      })
    })
    lessonAudioButtons.forEach((button, index) => {
      button.setAttribute('role', 'button')
      button.setAttribute('tabindex', '0')
      button.setAttribute('aria-label', button.dataset.audioLabel ?? '播放发音')
      button.setAttribute('aria-pressed', 'false')
      button.addEventListener('click', lessonAudioHandlers[index])
    })

    const quizOptions = [...scope.querySelectorAll<HTMLButtonElement>('.quiz-option')]
    const quizHandlers = quizOptions.map((option) => () => {
      const card = option.closest<HTMLElement>('.quiz-card')
      if (!card) return
      const isCorrect = option.textContent?.trim() === card.dataset.answer
      card.querySelectorAll('.quiz-option').forEach((item) => item.classList.remove('correct', 'wrong'))
      option.classList.add(isCorrect ? 'correct' : 'wrong')
      const feedback = card.querySelector<HTMLElement>('.quiz-feedback')
      if (feedback) feedback.textContent = isCorrect ? '答对了。' : `再想一下，正确答案是“${card.dataset.answer}”。`
    })
    quizOptions.forEach((option, index) => option.addEventListener('click', quizHandlers[index]))

    if (pageId === 'video-study') {
      const playButtons = [...scope.querySelectorAll<HTMLElement>('.big-play,.ctrl-btn')]
      const controlIcon = scope.querySelector<SVGPathElement>('.ctrl-btn svg path')
      const video = scope.querySelector<HTMLVideoElement>('.study-video')
      const track = scope.querySelector<HTMLElement>('.track')
      const fill = scope.querySelector<HTMLElement>('.track .fill')
      const thumb = scope.querySelector<HTMLElement>('.track .thumb')
      const timecode = scope.querySelector<HTMLElement>('.timecode')
      const durationLabel = scope.querySelector<HTMLElement>('.subhead .meta .tc')
      const subtitlesBody = scope.querySelector<HTMLElement>('.subs-body')
      const postcard = scope.querySelector<HTMLElement>('.postcard')
      const subtitlesHead = scope.querySelector<HTMLElement>('.subs-head')
      const lines = video01Subtitles
      const rows = lines.map((line) => {
        const row = document.createElement('div')
        row.className = 'row'
        const timestamp = document.createElement('span')
        timestamp.className = 't'
        timestamp.textContent = formatTime(line.start)
        const speaker = document.createElement('span')
        speaker.className = 'speaker'
        speaker.textContent = '对白'
        const text = document.createElement('div')
        text.className = 'yue'
        text.textContent = script === 'traditional' ? line.traditional : line.yue
        row.append(timestamp, speaker, text)
        return row
      })
      if (subtitlesBody && subtitlesHead && postcard) {
        subtitlesBody.replaceChildren(subtitlesHead, ...rows, postcard)
      }
      let selectedLine = lines[0]
      let activeIndex = -1

      const renderTime = () => {
        const current = video?.currentTime ?? 0
        const duration = Number.isFinite(video?.duration) ? video!.duration : 0
        const progress = duration ? Math.min(100, current / duration * 100) : 0
        if (fill) fill.style.width = `${progress}%`
        if (thumb) thumb.style.left = `${progress}%`
        if (timecode) timecode.textContent = `${formatTime(current)} / ${formatTime(duration)}`
        if (durationLabel && duration) durationLabel.textContent = formatTime(duration)
        const nextActiveIndex = lines.findIndex((line) => current >= line.start && current < line.end)
        rows.forEach((row, index) => {
          row.classList.toggle('played', index < nextActiveIndex)
          row.classList.toggle('current', index === nextActiveIndex)
        })
        if (nextActiveIndex !== activeIndex && nextActiveIndex >= 0 && !video?.paused) {
          rows[nextActiveIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
        activeIndex = nextActiveIndex
      }
      const togglePlay = () => {
        if (!video) return
        if (video.paused) void video.play()
        else video.pause()
      }
      playButtons.forEach((button) => button.addEventListener('click', togglePlay))
      video?.addEventListener('click', togglePlay)
      const onPlay = () => {
        scope.querySelector('.big-play')?.classList.add('is-playing')
        controlIcon?.setAttribute('d', 'M7 5h4v14H7zM14 5h4v14h-4z')
      }
      const onPause = () => {
        scope.querySelector('.big-play')?.classList.remove('is-playing')
        controlIcon?.setAttribute('d', 'M7 4.5v15l13-7.5z')
        if (video && video.currentTime > 0 && !video.ended) void recordVideoProgress('cha-chaan-teng', video.currentTime)
      }
      const onEnded = () => { if (video) void recordVideoProgress('cha-chaan-teng', video.duration, true) }
      const onTrackClick = (event: Event) => {
        if (!video || !track || !Number.isFinite(video.duration)) return
        const mouse = event as MouseEvent
        const bounds = track.getBoundingClientRect()
        video.currentTime = Math.max(0, Math.min(video.duration, (mouse.clientX - bounds.left) / bounds.width * video.duration))
      }
      video?.addEventListener('loadedmetadata', renderTime)
      video?.addEventListener('durationchange', renderTime)
      video?.addEventListener('timeupdate', renderTime)
      video?.addEventListener('play', onPlay)
      video?.addEventListener('pause', onPause)
      video?.addEventListener('ended', onEnded)
      track?.addEventListener('click', onTrackClick)

      const updatePostcard = (lineIndex: number, row: HTMLElement) => {
        selectedLine = lines[Math.min(lineIndex, lines.length - 1)]
        postcard?.querySelector<HTMLElement>('.t')?.replaceChildren(formatTime(selectedLine.start))
        postcard?.querySelector<HTMLElement>('.speaker')?.replaceChildren('对白')
        postcard?.querySelector<HTMLElement>('.yue')?.replaceChildren(script === 'traditional' ? selectedLine.traditional : selectedLine.yue)
        postcard?.querySelector<HTMLElement>('.stamp')?.replaceChildren(selectedLine.jyutping)
        postcard?.querySelector<HTMLElement>('.zh-hand')?.replaceChildren(selectedLine.mandarin)
        rows.forEach((item) => item.classList.remove('current'))
        row.classList.add('current')
        row.after(postcard!)
        if (video) video.currentTime = selectedLine.start
        renderTime()
      }
      const rowHandlers = rows.map((row, index) => () => updatePostcard(index, row))
      rows.forEach((row, index) => row.addEventListener('click', rowHandlers[index]))

      const savedButton = postcard?.querySelector<HTMLElement>('.stamped')
      const renderSaved = () => {
        if (!savedButton) return
        const saved = isFavorite(selectedLine.id)
        savedButton.lastChild && (savedButton.lastChild.textContent = saved ? ' 已收藏' : ' 收藏')
        savedButton.classList.toggle('not-saved', !saved)
      }
      const onSave = async () => {
        if (!isLoggedIn) {
          navigate('/login?next=/watch/cha-chaan-teng')
          return
        }
        try {
          await toggleFavorite(selectedLine)
          renderSaved()
        } catch {
          if (savedButton?.lastChild) savedButton.lastChild.textContent = ' 保存失败'
        }
      }
      savedButton?.addEventListener('click', onSave)
      const replay = postcard?.querySelector<HTMLElement>('.btn-outline')
      const onReplay = () => { if (!video) return; video.currentTime = selectedLine.start; void video.play() }
      replay?.addEventListener('click', onReplay)
      renderSaved()
      renderTime()

      return () => {
        window.removeEventListener('scroll', onScroll)
        scope.removeEventListener('click', onClick)
        tabs.forEach((tab) => tab.removeEventListener('click', onTabClick))
        filters.forEach((filter) => filter.removeEventListener('click', onFilterClick))
        playButtons.forEach((button) => button.removeEventListener('click', togglePlay))
        rows.forEach((row, index) => row.removeEventListener('click', rowHandlers[index]))
        video?.removeEventListener('click', togglePlay)
        video?.removeEventListener('loadedmetadata', renderTime)
        video?.removeEventListener('durationchange', renderTime)
        video?.removeEventListener('timeupdate', renderTime)
        video?.removeEventListener('play', onPlay)
        video?.removeEventListener('pause', onPause)
        video?.removeEventListener('ended', onEnded)
        track?.removeEventListener('click', onTrackClick)
        savedButton?.removeEventListener('click', onSave)
        replay?.removeEventListener('click', onReplay)
      }
    }
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      scope.removeEventListener('click', onClick)
      tabs.forEach((tab) => tab.removeEventListener('click', onTabClick))
      filters.forEach((filter) => filter.removeEventListener('click', onFilterClick))
      lessonAudioButtons.forEach((button, index) => button.removeEventListener('click', lessonAudioHandlers[index]))
      quizOptions.forEach((option, index) => option.removeEventListener('click', quizHandlers[index]))
    }
  }, [isFavorite, isLoggedIn, markup, navigate, pageCss, pageId, recordVideoProgress, script, setScript, toggleFavorite, user])

  return <div ref={root} className={`prototype-page prototype-${pageId}`} />
}
