import { useEffect, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { usePlayerStore, Track } from '../store/playerStore'

export function useAudioPlayer() {
  const soundRef = useRef<Howl | null>(null)
  const {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTime,
    setDuration,
  } = usePlayerStore()

  // 加载音频
  useEffect(() => {
    if (currentTrack) {
      // 卸载旧音频
      if (soundRef.current) {
        soundRef.current.unload()
      }

      // 加载新音频
      soundRef.current = new Howl({
        src: [currentTrack.audioUrl],
        html5: true,
        volume: volume,
        onplay: () => {
          // 开始播放时更新时长
          if (soundRef.current) {
            setDuration(soundRef.current.duration())
          }
        },
        onend: () => {
          // 播放完成，自动下一首
          const { next } = usePlayerStore.getState()
          next()
        },
      })
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unload()
        soundRef.current = null
      }
    }
  }, [currentTrack?.id])

  // 播放/暂停控制
  useEffect(() => {
    if (soundRef.current) {
      if (isPlaying) {
        soundRef.current.play()
      } else {
        soundRef.current.pause()
      }
    }
  }, [isPlaying])

  // 音量控制
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume)
    }
  }, [volume])

  // 更新播放进度
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isPlaying && soundRef.current) {
      interval = setInterval(() => {
        if (soundRef.current) {
          setCurrentTime(soundRef.current.seek() as number)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  // 播放控制方法
  const seek = useCallback((time: number) => {
    if (soundRef.current) {
      soundRef.current.seek(time)
      setCurrentTime(time)
    }
  }, [setCurrentTime])

  const stop = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stop()
      setCurrentTime(0)
    }
  }, [setCurrentTime])

  return {
    seek,
    stop,
  }
}

// 播放单个曲目
export function playTrack(track: Track, playlist?: Track[]) {
  const { setTrack } = usePlayerStore.getState()
  setTrack(track, playlist)
}

// 切换播放/暂停
export function togglePlay() {
  const { toggle } = usePlayerStore.getState()
  toggle()
}
