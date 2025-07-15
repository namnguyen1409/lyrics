import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Button, 
  Slider, 
  Typography, 
  Space, 
  Row, 
  Col, 
  message,
  Progress,
  Tag,
  Tooltip,
  Select,
  List
} from 'antd'
import { 
  ArrowLeftOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  SaveOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  FieldTimeOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  UndoOutlined
} from '@ant-design/icons'
import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

const { Title, Text } = Typography
const { Option } = Select

function LyricsSynchronizer() {
  const navigate = useNavigate()
  const audioRef = useRef(null)
  const lyricsListRef = useRef(null)
  
  const [projectData, setProjectData] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [syncedLyrics, setSyncedLyrics] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const lyricItemVariants = {
    inactive: { 
      scale: 1, 
      opacity: 0.7,
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    },
    active: { 
      scale: 1.02, 
      opacity: 1,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  useEffect(() => {
    // Load project data from session storage
    const data = sessionStorage.getItem('currentProject')
    
    console.log('Raw session data:', data) // Debug log
    
    if (data) {
      try {
        const parsed = JSON.parse(data)
        console.log('Parsed project data:', parsed) // Debug log
        setProjectData(parsed)
        const initialLyrics = parsed.lyrics.map((line, index) => ({ 
          text: line, 
          timestamp: index === 0 ? 0 : null,
          endTime: null
        }))
        setSyncedLyrics(initialLyrics)
        setCurrentLyricIndex(0)
      } catch (error) {
        console.error('Error parsing project data:', error)
        message.error('Dữ liệu dự án bị lỗi')
        navigate('/input')
      }
    } else {
      console.log('No session data found, creating test data') // Debug log
      
      // Create test data for development
      const testData = {
        songTitle: 'Test Song',
        artist: 'Test Artist',
        lyrics: [
          'This is the first line',
          'This is the second line',
          'This is the third line',
          'This is the fourth line'
        ],
        audioDataUrl: null,
        audioFileName: 'test.mp3',
        audioFileType: 'audio/mpeg'
      }
      
      // Set test data and proceed
      setProjectData(testData)
      const initialLyrics = testData.lyrics.map((line, index) => ({ 
        text: line, 
        timestamp: index === 0 ? 0 : null,
        endTime: null
      }))
      setSyncedLyrics(initialLyrics)
      setCurrentLyricIndex(0)
      
      message.info('Sử dụng dữ liệu test (không có audio)')
    }
  }, [navigate])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !projectData?.audioDataUrl) return

    const updateTime = () => {
      const time = audio.currentTime
      setCurrentTime(time)
      updateActiveLine(time)
    }
    
    const updateDuration = () => setDuration(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [projectData, syncedLyrics])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlayPause()
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        goToPreviousLine()
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        goToNextLine()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        seekBackward()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        seekForward()
      } else if (e.code === 'KeyS') {
        e.preventDefault()
        setEndTime(currentLyricIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentLyricIndex, syncedLyrics, currentTime])

  const updateActiveLine = (currentTime) => {
    const activeIndex = findActiveIndex(currentTime)
    if (activeIndex !== currentLyricIndex) {
      setCurrentLyricIndex(activeIndex)
      scrollToHighlightedLine(activeIndex)
    }
  }

  const findActiveIndex = (currentTime) => {
    for (let i = syncedLyrics.length - 1; i >= 0; i--) {
      const timestamp = syncedLyrics[i].timestamp
      if (timestamp !== null && currentTime >= timestamp) {
        return i
      }
    }
    return 0
  }

  const scrollToHighlightedLine = (index) => {
    if (!lyricsListRef.current) return
    
    const element = lyricsListRef.current.querySelector(`[data-index="${index}"]`)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !projectData.audioDataUrl) {
      message.warning('Không có file âm thanh để phát')
      return
    }
    
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(error => {
        console.error('Audio play error:', error)
        message.error('Không thể phát audio')
      })
    }
  }

  const setTimestamp = (index) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = { ...newLyrics[index], timestamp: currentTime }
      return newLyrics
    })
    message.success(`Đã đặt timestamp cho dòng ${index + 1}`)
  }

  const setEndTime = (index) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = { ...newLyrics[index], endTime: currentTime }
      return newLyrics
    })
    message.success(`Đã đặt thời gian kết thúc cho dòng ${index + 1}`)
  }

  const goToNextLine = () => {
    if (currentLyricIndex < syncedLyrics.length - 1) {
      const nextIndex = currentLyricIndex + 1
      
      // Auto set end time for current line if not set
      const currentLyric = syncedLyrics[currentLyricIndex]
      if (currentLyric.endTime === null) {
        setSyncedLyrics(prev => {
          const newLyrics = [...prev]
          newLyrics[currentLyricIndex] = { ...newLyrics[currentLyricIndex], endTime: currentTime }
          return newLyrics
        })
      }
      
      // Set timestamp for next line
      setSyncedLyrics(prev => {
        const newLyrics = [...prev]
        newLyrics[nextIndex] = { ...newLyrics[nextIndex], timestamp: currentTime }
        return newLyrics
      })
      
      setCurrentLyricIndex(nextIndex)
    }
  }

  const goToPreviousLine = () => {
    if (currentLyricIndex > 0) {
      if (currentLyricIndex !== 0) {
        setSyncedLyrics(prev => {
          const newLyrics = [...prev]
          newLyrics[currentLyricIndex] = { 
            ...newLyrics[currentLyricIndex], 
            timestamp: null,
            endTime: null 
          }
          return newLyrics
        })
      }
      
      const prevIndex = currentLyricIndex - 1
      const prevTimestamp = syncedLyrics[prevIndex]?.timestamp
      if (prevTimestamp !== null && audioRef.current) {
        audioRef.current.currentTime = prevTimestamp
      }
      
      setCurrentLyricIndex(prevIndex)
    }
  }

  const seekBackward = () => {
    const audio = audioRef.current
    audio.currentTime = Math.max(0, audio.currentTime - 5)
  }

  const seekForward = () => {
    const audio = audioRef.current
    audio.currentTime = Math.min(duration, audio.currentTime + 5)
  }

  const handleProgressChange = (value) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = (value / 100) * duration
    }
  }

  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }

  const handleLyricClick = (index) => {
    setCurrentLyricIndex(index)
    const timestamp = syncedLyrics[index].timestamp
    if (timestamp !== null && audioRef.current) {
      audioRef.current.currentTime = timestamp
    }
  }

  const clearTimestamp = (index) => {
    if (index === 0) return
    
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = { 
        ...newLyrics[index], 
        timestamp: null,
        endTime: null 
      }
      return newLyrics
    })
    message.info(`Đã xóa timestamp cho dòng ${index + 1}`)
  }

  const formatTime = (time) => {
    if (time === null || time === undefined) return '?'
    return time.toFixed(2)
  }

  const formatDisplayTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const saveProject = async () => {
    if (!projectData) return
    
    setIsSaving(true)
    try {
      const projectId = uuidv4()
      const projectToSave = {
        id: projectId,
        title: projectData.songTitle,
        artist: projectData.artist,
        lyrics: syncedLyrics,
        createdAt: new Date().toISOString(),
        audioFileName: projectData.audioFileName,
        audioDataUrl: projectData.audioDataUrl,
        audioFileType: projectData.audioFileType
      }

      await localforage.setItem(`project_${projectId}`, projectToSave)

      const projectsList = await localforage.getItem('projects_list') || []
      projectsList.push(projectId)
      await localforage.setItem('projects_list', projectsList)

      message.success('Dự án đã được lưu thành công!')
      navigate('/saved')
    } catch (error) {
      console.error('Error saving project:', error)
      message.error('Có lỗi xảy ra khi lưu dự án')
    } finally {
      setIsSaving(false)
    }
  }

  const getProgressPercentage = () => {
    return duration > 0 ? (currentTime / duration) * 100 : 0
  }

  const getSyncedCount = () => {
    return syncedLyrics.filter(l => l.timestamp !== null).length
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl text-purple-400 mb-4"
          >
            <PlayCircleOutlined />
          </motion.div>
          <Title level={3} className="!text-white !mb-2">
            Đang tải dự án...
          </Title>
          <Text className="text-gray-300">
            Vui lòng chờ trong giây lát
          </Text>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        className="container mx-auto px-4 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="mb-6"
          variants={itemVariants}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <Row justify="space-between" align="middle">
              <Col>
                <Space size="large">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      type="default"
                      icon={<ArrowLeftOutlined />}
                      size="large"
                      onClick={() => navigate('/input')}
                    >
                      Quay lại
                    </Button>
                  </motion.div>
                  <div>
                    <Title level={3} className="!text-white !mb-1">
                      {projectData.songTitle}
                    </Title>
                    <Text className="text-gray-300">{projectData.artist}</Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    size="large"
                    loading={isSaving}
                    onClick={saveProject}
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu dự án'}
                  </Button>
                </motion.div>
              </Col>
            </Row>
          </Card>
        </motion.div>

        <Row gutter={[24, 24]}>
          {/* Audio Controls */}
          <Col xs={24} lg={8}>
            <motion.div variants={itemVariants}>
              <Card 
                className="bg-white/10 backdrop-blur-lg border-white/20 sticky top-6"
                title={<Text className="text-white font-semibold">Điều khiển âm thanh</Text>}
              >
                <audio
                  ref={audioRef}
                  src={projectData.audioDataUrl || undefined}
                  preload="metadata"
                  onError={() => console.log('Audio load error - this is expected for test data')}
                />
                
                <Space direction="vertical" className="w-full" size="large">
                  {/* Play/Pause Button */}
                  <motion.div
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                      onClick={togglePlayPause}
                      className="!w-16 !h-16 !text-2xl"
                    />
                  </motion.div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Text className="text-white">{formatDisplayTime(currentTime)}</Text>
                      <Text className="text-white">{formatDisplayTime(duration)}</Text>
                    </div>
                    <Slider
                      value={getProgressPercentage()}
                      onChange={handleProgressChange}
                      className="!mb-0"
                      tooltip={{ 
                        formatter: (value) => formatDisplayTime((value / 100) * duration)
                      }}
                    />
                  </div>

                  {/* Speed Control */}
                  <div>
                    <Text className="text-white block mb-2">Tốc độ phát:</Text>
                    <Select
                      value={playbackSpeed}
                      onChange={handlePlaybackSpeedChange}
                      className="w-full"
                      size="large"
                    >
                      <Option value={0.5}>0.5x</Option>
                      <Option value={0.75}>0.75x</Option>
                      <Option value={1}>1x</Option>
                      <Option value={1.25}>1.25x</Option>
                      <Option value={1.5}>1.5x</Option>
                      <Option value={2}>2x</Option>
                    </Select>
                  </div>

                  {/* Control Buttons */}
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Button
                        block
                        icon={<FastBackwardOutlined />}
                        onClick={seekBackward}
                      >
                        -5s
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        block
                        icon={<FastForwardOutlined />}
                        onClick={seekForward}
                      >
                        +5s
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        block
                        icon={<CaretUpOutlined />}
                        onClick={goToPreviousLine}
                        disabled={currentLyricIndex === 0}
                      >
                        Dòng trước
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        block
                        icon={<CaretDownOutlined />}
                        onClick={goToNextLine}
                        disabled={currentLyricIndex === syncedLyrics.length - 1}
                      >
                        Dòng tiếp
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        block
                        type="primary"
                        icon={<FieldTimeOutlined />}
                        onClick={() => setTimestamp(currentLyricIndex)}
                      >
                        Set Time
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        block
                        icon={<FieldTimeOutlined />}
                        onClick={() => setEndTime(currentLyricIndex)}
                      >
                        Set End
                      </Button>
                    </Col>
                  </Row>

                  {/* Progress Info */}
                  <div className="text-center">
                    <Progress
                      percent={(getSyncedCount() / syncedLyrics.length) * 100}
                      format={() => `${getSyncedCount()}/${syncedLyrics.length}`}
                      strokeColor={{
                        '0%': '#6366f1',
                        '100%': '#8b5cf6',
                      }}
                    />
                    <Text className="text-gray-300 text-sm">Tiến độ đồng bộ</Text>
                  </div>
                </Space>
              </Card>
            </motion.div>
          </Col>

          {/* Lyrics List */}
          <Col xs={24} lg={16}>
            <motion.div variants={itemVariants}>
              <Card 
                className="bg-white/10 backdrop-blur-lg border-white/20"
                title={<Text className="text-white font-semibold">Danh sách lời bài hát</Text>}
              >
                <div 
                  ref={lyricsListRef}
                  className="max-h-96 overflow-y-auto pr-2"
                >
                  <AnimatePresence>
                    {syncedLyrics.map((lyric, index) => (
                      <motion.div
                        key={index}
                        data-index={index}
                        variants={lyricItemVariants}
                        animate={index === currentLyricIndex ? 'active' : 'inactive'}
                        className="mb-3 p-4 rounded-lg border border-white/10 cursor-pointer"
                        onClick={() => handleLyricClick(index)}
                        whileHover={{ scale: 1.01 }}
                      >
                        <Row justify="space-between" align="middle">
                          <Col flex="auto">
                            <Space direction="vertical" className="w-full">
                              <Text className="text-white text-base font-medium">
                                {lyric.text}
                              </Text>
                              <Space>
                                <Tag color={lyric.timestamp !== null ? 'green' : 'default'}>
                                  Start: {formatTime(lyric.timestamp)}
                                </Tag>
                                <Tag color={lyric.endTime !== null ? 'orange' : 'default'}>
                                  End: {formatTime(lyric.endTime)}
                                </Tag>
                              </Space>
                            </Space>
                          </Col>
                          <Col>
                            <Space>
                              <Tooltip title="Đặt timestamp hiện tại">
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<FieldTimeOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setTimestamp(index)
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="Đặt thời gian kết thúc">
                                <Button
                                  size="small"
                                  icon={<FieldTimeOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEndTime(index)
                                  }}
                                />
                              </Tooltip>
                              {lyric.timestamp !== null && index !== 0 && (
                                <Tooltip title="Xóa timestamp">
                                  <Button
                                    danger
                                    size="small"
                                    icon={<UndoOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      clearTimestamp(index)
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Space>
                          </Col>
                        </Row>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </div>
  )
}

export default LyricsSynchronizer
