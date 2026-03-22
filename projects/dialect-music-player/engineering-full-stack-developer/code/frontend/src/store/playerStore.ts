import { create } from 'zustand'

export interface Track {
  id: string
  name: string
  audioUrl: string
  duration: number
  type: 'dialect' | 'music'
  cityName?: string
  artist?: string
}

interface PlayerState {
  // 当前播放信息
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  
  // 播放列表
  playlist: Track[]
  currentIndex: number
  
  // Actions
  setTrack: (track: Track, playlist?: Track[]) => void
  play: () => void
  pause: () => void
  toggle: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  next: () => void
  prev: () => void
  addToPlaylist: (track: Track) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playlist: [],
  currentIndex: -1,
  
  setTrack: (track, playlist) => {
    const state = get()
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      playlist: playlist || [track],
      currentIndex: playlist ? playlist.findIndex(t => t.id === track.id) : 0,
    })
  },
  
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  
  next: () => {
    const state = get()
    if (state.playlist.length > 0 && state.currentIndex < state.playlist.length - 1) {
      const nextTrack = state.playlist[state.currentIndex + 1]
      set({
        currentTrack: nextTrack,
        currentIndex: state.currentIndex + 1,
        currentTime: 0,
        isPlaying: true,
      })
    }
  },
  
  prev: () => {
    const state = get()
    if (state.playlist.length > 0 && state.currentIndex > 0) {
      const prevTrack = state.playlist[state.currentIndex - 1]
      set({
        currentTrack: prevTrack,
        currentIndex: state.currentIndex - 1,
        currentTime: 0,
        isPlaying: true,
      })
    }
  },
  
  addToPlaylist: (track) => {
    const state = get()
    set({ playlist: [...state.playlist, track] })
  },
}))
