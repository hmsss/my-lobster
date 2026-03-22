import { useEffect } from 'react'
import { Progress, Slider, Button, Space } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, SoundOutlined, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons'
import { usePlayerStore } from '../store/playerStore'
import { useAudioPlayer, togglePlay } from '../hooks/useAudioPlayer'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    next,
    prev,
  } = usePlayerStore()
  
  const { seek } = useAudioPlayer()

  if (!currentTrack) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        选择一首歌曲开始播放
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      background: '#fff',
      borderTop: '1px solid #f0f0f0',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
      zIndex: 1000,
    }}>
      {/* 当前播放信息 */}
      <div style={{ minWidth: 200, maxWidth: 300 }}>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentTrack.name}
        </div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {currentTrack.type === 'dialect' 
            ? currentTrack.cityName 
            : currentTrack.artist || '未知艺术家'}
        </div>
      </div>

      {/* 播放控制 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        <Space size="large">
          <Button 
            type="text" 
            icon={<StepBackwardOutlined style={{ fontSize: 20 }} />}
            onClick={prev}
          />
          <Button
            type="text"
            icon={isPlaying 
              ? <PauseCircleOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              : <PlayCircleOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            }
            onClick={togglePlay}
          />
          <Button 
            type="text" 
            icon={<StepForwardOutlined style={{ fontSize: 20 }} />}
            onClick={next}
          />
        </Space>
        
        {/* 进度条 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 600, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#999', minWidth: 40 }}>
            {formatTime(currentTime)}
          </span>
          <Slider
            value={progress}
            onChange={(value) => seek((value / 100) * duration)}
            style={{ flex: 1 }}
            tooltipVisible={false}
          />
          <span style={{ fontSize: 12, color: '#999', minWidth: 40 }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 音量控制 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
        <SoundOutlined style={{ color: '#999' }} />
        <Slider
          value={volume * 100}
          onChange={(value) => setVolume(value / 100)}
          style={{ width: 80 }}
          tooltipVisible={false}
        />
      </div>
    </div>
  )
}
