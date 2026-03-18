import { useState, useEffect, useRef } from 'react'
import { Upload, List, Card, Button, message, Empty, Popconfirm } from 'antd'
import { PlayCircleOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { musicApi } from '../services/api'
import { usePlayerStore, Track } from '../store/playerStore'
import { playTrack } from '../hooks/useAudioPlayer'

interface MusicItem {
  id: string
  name: string
  artist: string | null
  album: string | null
  duration: number
  durationText: string
  audioUrl: string
  fileSizeText: string
  fileType: string
}

export default function MusicPage() {
  const [musicList, setMusicList] = useState<MusicItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentTrack } = usePlayerStore()

  // 加载音乐列表
  const loadMusicList = async () => {
    setLoading(true)
    try {
      const res = await musicApi.getList()
      if (res.data.code === 0) {
        setMusicList(res.data.data.items)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMusicList()
  }, [])

  // 上传音乐
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a']
    if (!allowedTypes.some(t => file.type.includes(t.split('/')[1]))) {
      message.error('仅支持 mp3, wav, ogg, m4a 格式')
      return
    }

    // 检查文件大小 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      message.error('文件大小不能超过 20MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await musicApi.upload(file)
      if (res.data.code === 0) {
        message.success('上传成功')
        loadMusicList()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error('上传失败: ' + (err.message || '未知错误'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 删除音乐
  const handleDelete = async (id: string) => {
    try {
      const res = await musicApi.delete(id)
      if (res.data.code === 0) {
        message.success('删除成功')
        loadMusicList()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error('删除失败')
    }
  }

  // 播放音乐
  const handlePlay = (item: MusicItem) => {
    const track: Track = {
      id: item.id,
      name: item.name,
      audioUrl: item.audioUrl,
      duration: item.duration,
      type: 'music',
      artist: item.artist || undefined,
    }

    // 将当前列表转为播放列表
    const playlist = musicList.map(m => ({
      id: m.id,
      name: m.name,
      audioUrl: m.audioUrl,
      duration: m.duration,
      type: 'music' as const,
      artist: m.artist || undefined,
    }))

    playTrack(track, playlist)
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="本地音乐"
        extra={
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              上传音乐
            </Button>
          </div>
        }
      >
        {musicList.length === 0 ? (
          <Empty description="暂无音乐，点击上传添加" />
        ) : (
          <List
            loading={loading}
            dataSource={musicList}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <span key="info">{item.durationText} | {item.fileSizeText}</span>,
                  <PlayCircleOutlined
                    key="play"
                    style={{ fontSize: 24, cursor: 'pointer', color: '#1890ff' }}
                    onClick={() => handlePlay(item)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定删除？"
                    onConfirm={() => handleDelete(item.id)}
                  >
                    <DeleteOutlined
                      style={{ fontSize: 24, cursor: 'pointer', color: '#ff4d4f' }}
                    />
                  </Popconfirm>,
                ]}
                style={{
                  backgroundColor: currentTrack?.id === item.id ? '#e6f7ff' : undefined,
                  padding: '12px 16px',
                  borderRadius: 8,
                }}
              >
                <List.Item.Meta
                  title={item.name}
                  description={
                    item.artist 
                      ? `${item.artist}${item.album ? ` - ${item.album}` : ''}`
                      : '未知艺术家'
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
