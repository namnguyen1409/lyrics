import { Routes, Route } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import HomePage from './components/HomePage'
import AudioLyricsInput from './components/AudioLyricsInput'
import LyricsSynchronizer from './components/LyricsSynchronizer'
import SavedProjects from './components/SavedProjects'
import ProjectPreview from './components/ProjectPreview'

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          colorBgContainer: 'rgba(255, 255, 255, 0.1)',
          colorBorder: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 12,
          fontSize: 16,
        },
        components: {
          Card: {
            colorBgContainer: 'rgba(255, 255, 255, 0.1)',
            colorBorder: 'rgba(255, 255, 255, 0.2)',
          },
          Button: {
            borderRadius: 8,
            controlHeight: 44,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 44,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 44,
          },
        },
      }}
    >
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/input" element={<AudioLyricsInput />} />
          <Route path="/sync" element={<LyricsSynchronizer />} />
          <Route path="/saved" element={<SavedProjects />} />
          <Route path="/preview/:projectId" element={<ProjectPreview />} />
        </Routes>
      </div>
    </ConfigProvider>
  )
}

export default App
