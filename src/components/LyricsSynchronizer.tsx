import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
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
  Select
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
import type { ProjectData, LyricLine } from '../types'

const { Title, Text } = Typography
const { Option } = Select

// Memoized LyricItem component to prevent unnecessary re-renders
interface LyricItemProps {
  lyric: LyricLine
  index: number
  isActive: boolean
  onLyricClick: (index: number) => void
  onSetTimestamp: (index: number) => void
  onSetEndTime: (index: number) => void
  onClearTimestamp: (index: number) => void
  formatTime: (time: number | null) => string
}

const LyricItem: React.FC<LyricItemProps> = React.memo(({
  lyric,
  index,
  isActive,
  onLyricClick,
  onSetTimestamp,
  onSetEndTime,
  onClearTimestamp,
  formatTime
}) => {
  const handleClick = useCallback(() => {
    onLyricClick(index)
  }, [onLyricClick, index])

  const handleSetTimestamp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSetTimestamp(index)
  }, [onSetTimestamp, index])

  const handleSetEndTime = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSetEndTime(index)
  }, [onSetEndTime, index])

  const handleClearTimestamp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClearTimestamp(index)
  }, [onClearTimestamp, index])

  return (
    <motion.div
      data-index={index}
      variants={lyricItemVariants}
      animate={isActive ? 'active' : 'inactive'}
      className="mb-3 p-4 rounded-lg border border-white/10 cursor-pointer"
      onClick={handleClick}
      whileHover={{ scale: 1.005 }} // Reduced from 1.01 for better performance
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
                onClick={handleSetTimestamp}
              />
            </Tooltip>
            <Tooltip title="Đặt thời gian kết thúc">
              <Button
                size="small"
                icon={<FieldTimeOutlined />}
                onClick={handleSetEndTime}
              />
            </Tooltip>
            {lyric.timestamp !== null && index !== 0 && (
              <Tooltip title="Xóa timestamp">
                <Button
                  danger
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={handleClearTimestamp}
                />
              </Tooltip>
            )}
          </Space>
        </Col>
      </Row>
    </motion.div>
  )
})

LyricItem.displayName = 'LyricItem'

// Optimized animation variants for better performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3, // Reduced from 0.6
      staggerChildren: 0.05 // Reduced from 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 }, // Reduced from y: 20
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 } // Reduced from 0.5
  }
}

const lyricItemVariants = {
  inactive: {
    scale: 1,
    opacity: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  active: {
    scale: 1.01, // Reduced from 1.02
    opacity: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    transition: {
      type: "tween" as const, // Changed from spring to tween for better performance
      duration: 0.2, // Added explicit duration
      ease: "easeOut" as const
    }
  }
}

const LyricsSynchronizer: React.FC = () => {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement>(null)
  const lyricsListRef = useRef<HTMLDivElement>(null)
  const throttledScrollRef = useRef<NodeJS.Timeout | null>(null)

  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0)
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[]>([])
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)

  useEffect(() => {
    // Load project data from session storage
    const loadProjectData = async () => {
      const data = sessionStorage.getItem('currentProject')

      if (data) {
        try {
          const parsed = JSON.parse(data)
          
          // If there's a tempAudioId, load audio from LocalForage
          if (parsed.tempAudioId) {
            try {
              const audioData = await localforage.getItem(`temp_audio_${parsed.tempAudioId}`) as string | null
              if (audioData) {
                parsed.audioDataUrl = audioData
                // Clean up temporary audio after loading
                await localforage.removeItem(`temp_audio_${parsed.tempAudioId}`)
              }
            } catch (error) {
              console.error('Error loading audio from LocalForage:', error)
              message.warning('Không thể tải file âm thanh')
            }
          }
          
          setProjectData(parsed)

          // Check if lyrics are already synced objects (editing mode) or just text array (new project)
          let initialLyrics
          if (parsed.isEditing && parsed.lyrics[0] && typeof parsed.lyrics[0] === 'object') {
            // Editing existing project - use existing lyrics with timestamps
            initialLyrics = parsed.lyrics.map((lyric: LyricLine) => ({
              text: lyric.text,
              timestamp: lyric.timestamp,
              endTime: lyric.endTime || null
            }))
            console.log('Loading existing project with timestamps')
          } else {
            // New project - convert text array to lyrics objects
            initialLyrics = parsed.lyrics.map((line: string | LyricLine, index: number) => ({
              text: typeof line === 'string' ? line : line.text, // Handle both string and object
              timestamp: index === 0 ? 0 : null,
              endTime: null
            }))
            console.log('Creating new project lyrics')
          }

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
    }
    
    loadProjectData()
  }, [navigate])

  // Memoized formatters
  const formatTime = useCallback((time: number | null) => {
    if (time === null || time === undefined) return '?'
    return time.toFixed(2)
  }, [])

  const formatDisplayTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // Memoize the active line finder for better performance
  const findActiveIndex = useCallback((currentTime: number): number => {
    for (let i = syncedLyrics.length - 1; i >= 0; i--) {
      const timestamp = syncedLyrics[i].timestamp
      if (timestamp !== null && currentTime >= timestamp) {
        return i
      }
    }
    return 0
  }, [syncedLyrics])

  // Optimized scroll function with better performance
  const scrollToHighlightedLine = useCallback((index: number): void => {
    if (!lyricsListRef.current) return

    const element = lyricsListRef.current.querySelector(`[data-index="${index}"]`)
    if (element) {
      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      })
    }
  }, [])

  // Optimized throttled scroll with reduced timeout
  const throttledScrollToLine = useCallback((index: number) => {
    if (throttledScrollRef.current) {
      clearTimeout(throttledScrollRef.current)
    }

    throttledScrollRef.current = setTimeout(() => {
      scrollToHighlightedLine(index)
    }, 50) // Reduced from 100ms for more responsiveness
  }, [scrollToHighlightedLine])

  // Optimized update active line function
  const updateActiveLine = useCallback((currentTime: number): void => {
    const activeIndex = findActiveIndex(currentTime)
    if (activeIndex !== currentLyricIndex) {
      setCurrentLyricIndex(activeIndex)
      // Use throttled scroll to avoid jarring movement
      throttledScrollToLine(activeIndex)
    }
  }, [currentLyricIndex, findActiveIndex, throttledScrollToLine])

  // Memoize expensive calculations
  const progressPercentage = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0
  }, [currentTime, duration])

  const syncedCount = useMemo(() => {
    return syncedLyrics.filter(l => l.timestamp !== null).length
  }, [syncedLyrics])

  // Memoized event handlers for better performance
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !projectData || !projectData.audioDataUrl) {
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
  }, [isPlaying, projectData])

  const setTimestamp = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = { ...newLyrics[index], timestamp: currentTime }
      return newLyrics
    })
    message.success(`Đã đặt timestamp cho dòng ${index + 1}`)
  }, [currentTime])

  const setEndTime = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = { ...newLyrics[index], endTime: currentTime }
      return newLyrics
    })
    message.success(`Đã đặt thời gian kết thúc cho dòng ${index + 1}`)
  }, [currentTime])

  const goToNextLine = useCallback(() => {
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
      // Auto-scroll will be handled by useEffect
    }
  }, [currentLyricIndex, syncedLyrics, currentTime])

  const goToPreviousLine = useCallback(() => {
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
      // Auto-scroll will be handled by useEffect
    }
  }, [currentLyricIndex, syncedLyrics])

  const seekBackward = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 5)
    }
  }, [])

  const seekForward = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.min(duration, audio.currentTime + 5)
    }
  }, [duration])

  const handleProgressChange = useCallback((value: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = (value / 100) * duration
    }
  }, [duration])

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }, [])

  const handleLyricClick = useCallback((index: number) => {
    setCurrentLyricIndex(index)
    const timestamp = syncedLyrics[index].timestamp
    if (timestamp !== null && audioRef.current) {
      audioRef.current.currentTime = timestamp
    }

    // Auto scroll to the clicked line
    scrollToHighlightedLine(index)
  }, [syncedLyrics, scrollToHighlightedLine])

  const clearTimestamp = useCallback((index: number) => {
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
  }, [])

  const saveProject = useCallback(async () => {
    if (!projectData) return

    setIsSaving(true)
    try {
      // Check if this is editing an existing project
      const isEditing = projectData.isEditing && projectData.projectId
      const projectId = isEditing ? projectData.projectId : uuidv4()

      const projectToSave = {
        id: projectId,
        title: projectData.songTitle,
        artist: projectData.artist,
        lyrics: syncedLyrics,
        createdAt: isEditing ?
          // Keep original creation date if editing
          ((await localforage.getItem(`project_${projectId}`) as ProjectData | null)?.createdAt || new Date().toISOString()) :
          new Date().toISOString(),
        updatedAt: new Date().toISOString(), // Add update timestamp
        audioFileName: projectData.audioFileName,
        audioDataUrl: projectData.audioDataUrl,
        audioFileType: projectData.audioFileType
      }

      await localforage.setItem(`project_${projectId}`, projectToSave)

      if (!isEditing) {
        // Only add to projects list if it's a new project
        let projectsList = await localforage.getItem('projects_list')
        if (!Array.isArray(projectsList)) {
          projectsList = []
        }
        // Assert type to string[]
        const projectsListArr = projectsList as string[]
        if (typeof projectId === 'string' && !projectsListArr.includes(projectId)) {
          projectsListArr.push(projectId)
          await localforage.setItem('projects_list', projectsListArr)
        }
      }

      message.success(isEditing ? 'Dự án đã được cập nhật thành công!' : 'Dự án đã được lưu thành công!')
      navigate('/saved')
    } catch (error) {
      console.error('Error saving project:', error)
      message.error('Có lỗi xảy ra khi lưu dự án')
    } finally {
      setIsSaving(false)
    }
  }, [projectData, syncedLyrics, navigate])

  // Keyboard controls handler
  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
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
    } else if (e.code === 'KeyE') {
      e.preventDefault()
      setEndTime(currentLyricIndex)
    }
  }, [togglePlayPause, goToPreviousLine, goToNextLine, seekBackward, seekForward, setEndTime, currentLyricIndex])

  // All effects after functions are defined
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
  }, [projectData, updateActiveLine])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Optimized auto scroll when current lyric index changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToHighlightedLine(currentLyricIndex)
    }, 30) // Reduced from 50ms for faster response

    return () => clearTimeout(timeoutId)
  }, [currentLyricIndex, scrollToHighlightedLine])

  // Cleanup throttled scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (throttledScrollRef.current) {
        clearTimeout(throttledScrollRef.current)
      }
    }
  }, [])

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
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <Row>
              <div>
                <Title level={3} className="!text-white !mb-1">
                  {projectData.songTitle} {projectData.isEditing && <span className="text-orange-400">(Đang chỉnh sửa)</span>}
                </Title>
                <Text className="text-gray-300">{projectData.artist}</Text>
              </div>
            </Row>
            <Row justify="space-between" align="middle">

              <Col>
                <Space size="large">
                  <motion.div
                    whileHover={{ scale: 1.03 }} // Reduced from 1.1
                    whileTap={{ scale: 0.97 }} // Reduced from 0.9
                  >
                    <Button
                      type="default"
                      icon={<ArrowLeftOutlined />}
                      size="large"
                      onClick={() => {
                        // Navigate back to input or saved page based on editing state
                        if (projectData.isEditing) {
                          navigate('/saved')
                        }
                        else {
                          navigate('/input')
                        }
                      }}
                    >
                      Quay lại
                    </Button>
                  </motion.div>

                </Space>
              </Col>
              <Col>
                <motion.div
                  whileHover={{ scale: 1.02 }} // Reduced from 1.05
                  whileTap={{ scale: 0.98 }} // Reduced from 0.95
                >
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    size="large"
                    loading={isSaving}
                    onClick={saveProject}
                  >
                    {isSaving ? 'Đang lưu...' : (projectData.isEditing ? 'Cập nhật dự án' : 'Lưu dự án')}
                  </Button>
                </motion.div>
              </Col>
            </Row>
          </Card>
        </motion.div>

        <Row gutter={[24, 24]} className="items-start" style={{ alignItems: 'flex-start' }}>
          {/* Audio Controls */}
          <Col xs={24} lg={8} className="flex">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <Card
                className="bg-white/10 backdrop-blur-lg border-white/20 sticky h-fit w-full"
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
                    whileHover={{ scale: 1.02 }} // Reduced from 1.05
                    whileTap={{ scale: 0.98 }} // Reduced from 0.95
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
                      value={progressPercentage}
                      onChange={handleProgressChange}
                      className="!mb-0"
                      tooltip={{
                        formatter: (value) => value !== undefined ? formatDisplayTime((value / 100) * duration) : '?'
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
                      percent={(syncedCount / syncedLyrics.length) * 100}
                      format={() => `${syncedCount}/${syncedLyrics.length}`}
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
          <Col xs={24} lg={16} className="flex">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <Card
                className="bg-white/10 backdrop-blur-lg border-white/20 h-fit w-full"
                title={<Text className="text-white font-semibold">Danh sách lời bài hát</Text>}
              >
                <div
                  ref={lyricsListRef}
                  className="max-h-[600px] overflow-y-auto pr-2"
                  style={{
                    scrollBehavior: 'smooth',
                    scrollPaddingTop: '40px',
                    scrollPaddingBottom: '40px',
                    // Optimized CSS for better scrolling performance
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(139, 92, 246, 0.3) transparent',
                    // Performance improvements
                    willChange: 'scroll-position',
                    contain: 'layout style paint',
                    transform: 'translateZ(0)', // Hardware acceleration
                    WebkitOverflowScrolling: 'touch' // iOS smooth scrolling
                  }}
                >
                  {syncedLyrics.map((lyric, index) => (
                    <LyricItem
                      key={index}
                      lyric={lyric}
                      index={index}
                      isActive={index === currentLyricIndex}
                      onLyricClick={handleLyricClick}
                      onSetTimestamp={setTimestamp}
                      onSetEndTime={setEndTime}
                      onClearTimestamp={clearTimestamp}
                      formatTime={formatTime}
                    />
                  ))}
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
