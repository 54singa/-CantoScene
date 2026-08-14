let activeAudio: HTMLAudioElement | null = null
let activeSource = ''
let notifyActive: ((playing: boolean) => void) | null = null

function clearActive(audio: HTMLAudioElement) {
  if (activeAudio !== audio) return
  activeAudio = null
  activeSource = ''
  notifyActive?.(false)
  notifyActive = null
}

export function toggleAudio(source: string, onPlayingChange?: (playing: boolean) => void) {
  if (activeAudio && activeSource === source && !activeAudio.paused) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    clearActive(activeAudio)
    return
  }

  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    clearActive(activeAudio)
  }

  const audio = new Audio(source)
  activeAudio = audio
  activeSource = source
  notifyActive = onPlayingChange ?? null
  audio.addEventListener('ended', () => clearActive(audio), { once: true })
  audio.addEventListener('error', () => clearActive(audio), { once: true })
  onPlayingChange?.(true)
  void audio.play().catch(() => clearActive(audio))
}
