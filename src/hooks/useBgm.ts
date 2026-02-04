import { useEffect, useRef } from 'react'

export function useBgm(src: string, volume = 0.5) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    const unlock = () => {
      audio.play().catch(() => {})
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }

    // 브라우저 자동재생 제한 대응
    window.addEventListener('click', unlock)
    window.addEventListener('keydown', unlock)

    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
      audio.pause()
      audioRef.current = null
    }
  }, [src, volume])
}
