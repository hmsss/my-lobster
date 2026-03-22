import { useState, useEffect } from 'react'
import { Cascader, List, Card, Spin, Empty } from 'antd'
import { PlayCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { dialectApi } from '../services/api'
import { usePlayerStore, Track } from '../store/playerStore'
import { playTrack } from '../hooks/useAudioPlayer'

interface DialectItem {
  id: string
  cityId: string
  cityName: string
  name: string
  description: string
  duration: number
  durationText: string
  audioUrl: string
}

interface CascadeOption {
  value: string
  label: string
  children?: CascadeOption[]
}

export default function DialectPage() {
  const [cascadeData, setCascadeData] = useState<CascadeOption[]>([])
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [dialectList, setDialectList] = useState<DialectItem[]>([])
  const [loading, setLoading] = useState(false)
  const { currentTrack, isPlaying, setTrack } = usePlayerStore()

  // 加载省市级联数据
  useEffect(() => {
    dialectApi.getCascade().then((res) => {
      if (res.data.code === 0) {
        setCascadeData(res.data.data)
      }
    })
  }, [])

  // 加载方言列表
  const loadDialectList = async (cityId: string) => {
    setLoading(true)
    try {
      const res = await dialectApi.getList(cityId)
      if (res.data.code === 0) {
        setDialectList(res.data.data.items)
      }
    } finally {
      setLoading(false)
    }
  }

  // 处理级联选择
  const handleCascadeChange = (value: string[]) => {
    if (value && value.length === 2) {
      const cityId = value[1]
      setSelectedCityId(cityId)
      loadDialectList(cityId)
    }
  }

  // 播放方言
  const handlePlay = (item: DialectItem) => {
    const track: Track = {
      id: item.id,
      name: item.name,
      audioUrl: item.audioUrl,
      duration: item.duration,
      type: 'dialect',
      cityName: item.cityName,
    }
    
    // 将当前列表转为播放列表
    const playlist = dialectList.map(d => ({
      id: d.id,
      name: d.name,
      audioUrl: d.audioUrl,
      duration: d.duration,
      type: 'dialect' as const,
      cityName: d.cityName,
    }))
    
    playTrack(track, playlist)
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title="选择地区" style={{ marginBottom: 24 }}>
        <Cascader
          options={cascadeData}
          onChange={handleCascadeChange as any}
          placeholder="请选择省市"
          style={{ width: '100%' }}
          showSearch
          size="large"
        />
      </Card>

      {selectedCityId && (
        <Card title="方言列表">
          <Spin spinning={loading}>
            {dialectList.length === 0 ? (
              <Empty description="暂无方言数据" />
            ) : (
              <List
                dataSource={dialectList}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <span key="duration">{item.durationText}</span>,
                      <PlayCircleOutlined
                        key="play"
                        style={{ fontSize: 24, cursor: 'pointer', color: '#1890ff' }}
                        onClick={() => handlePlay(item)}
                      />,
                    ]}
                    style={{
                      backgroundColor: currentTrack?.id === item.id ? '#e6f7ff' : undefined,
                      padding: '12px 16px',
                      borderRadius: 8,
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          <EnvironmentOutlined style={{ marginRight: 8, color: '#999' }} />
                          {item.name}
                        </span>
                      }
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </Card>
      )}
    </div>
  )
}
