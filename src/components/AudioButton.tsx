import { Volume2 } from 'lucide-react'
import { useState } from 'react'

export function AudioButton({ label = '播放发音', compact = false }: { label?: string; compact?: boolean }) {
  const [playing, setPlaying] = useState(false)
  return (
    <button
      className={compact ? 'audio-button audio-button--compact' : 'audio-button'}
      onClick={() => { setPlaying(true); window.setTimeout(() => setPlaying(false), 650) }}
      aria-label={label}
      title="正式音频接入前的交互占位"
    >
      <Volume2 size={compact ? 15 : 18} className={playing ? 'pulse' : ''} />{compact ? null : label}
    </button>
  )
}
