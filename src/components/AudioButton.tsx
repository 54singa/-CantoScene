import { Volume2 } from 'lucide-react'
import { useState } from 'react'
import { toggleAudio } from '../lib/audio'

export function AudioButton({ label = '播放发音', compact = false, src }: { label?: string; compact?: boolean; src?: string }) {
  const [playing, setPlaying] = useState(false)
  return (
    <button
      className={compact ? 'audio-button audio-button--compact' : 'audio-button'}
      onClick={() => src && toggleAudio(src, setPlaying)}
      aria-label={label}
      aria-pressed={playing}
      disabled={!src}
      title={src ? label : '音频待生成'}
    >
      <Volume2 size={compact ? 15 : 18} className={playing ? 'pulse' : ''} />{compact ? null : label}
    </button>
  )
}
