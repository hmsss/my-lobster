import { useState } from 'react'
import { Layout, Menu } from 'antd'
import { SoundOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import DialectPage from './pages/DialectPage'
import MusicPage from './pages/MusicPage'
import PlayerBar from './components/PlayerBar'

const { Header, Content, Sider } = Layout

function App() {
  const [currentPage, setCurrentPage] = useState('dialect')

  const menuItems = [
    {
      key: 'dialect',
      icon: <SoundOutlined />,
      label: '方言',
    },
    {
      key: 'music',
      icon: <CustomerServiceOutlined />,
      label: '音乐',
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
      }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', marginRight: 48 }}>
          🎵 方言音乐播放器
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={(e) => setCurrentPage(e.key)}
          style={{ flex: 1, border: 'none' }}
        />
      </Header>
      
      <Layout>
        <Content style={{ 
          padding: '24px', 
          paddingBottom: 100,
          background: '#f5f5f5',
        }}>
          {currentPage === 'dialect' && <DialectPage />}
          {currentPage === 'music' && <MusicPage />}
        </Content>
      </Layout>

      <PlayerBar />
    </Layout>
  )
}

export default App
