import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Slider, Typography, Card, Spin, Modal } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined, SoundOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import localforage from 'localforage'

const { Title, Text } = Typography

function ProjectPreview() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const audioRef = useRef(null)
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !project?.audioDataUrl) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [project])

  const loadProject = async () => {
    try {
      const projectData = await localforage.getItem(`project_${projectId}`)
      if (projectData) {
        setProject(projectData)
      } else {
        Modal.error({
          title: 'Lỗi',
          content: 'Không tìm thấy dự án',
          onOk: () => navigate('/saved')
        })
      }
    } catch (error) {
      console.error('Error loading project:', error)
      Modal.error({
        title: 'Lỗi',
        content: 'Có lỗi xảy ra khi tải dự án',
        onOk: () => navigate('/saved')
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSeek = (seconds) => {
    const audio = audioRef.current
    if (seconds > 0) {
      audio.currentTime = Math.min(duration, audio.currentTime + seconds)
    } else {
      audio.currentTime = Math.max(0, audio.currentTime + seconds)
    }
  }

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return duration > 0 ? (currentTime / duration) * 100 : 0
  }

  // Karaoke effect: find current lyric and word position
  const getCurrentLyricState = () => {
    if (!project?.lyrics) return { lyricIndex: -1, wordIndex: 0, transitionState: 'none' }

    // Find current lyric line
    let currentLyricIndex = -1
    for (let i = project.lyrics.length - 1; i >= 0; i--) {
      const lyric = project.lyrics[i]
      if (lyric.timestamp !== null && currentTime >= lyric.timestamp) {
        currentLyricIndex = i
        break
      }
    }

    if (currentLyricIndex === -1) return { lyricIndex: -1, wordIndex: 0, transitionState: 'none' }

    const currentLyric = project.lyrics[currentLyricIndex]
    const nextLyric = project.lyrics[currentLyricIndex + 1]
    
    // Calculate word position based on time
    const lyricStartTime = currentLyric.timestamp
    // Use endTime if available, otherwise fallback to estimated duration
    const lyricEndTime = currentLyric.endTime !== null && currentLyric.endTime !== undefined 
      ? currentLyric.endTime 
      : (currentLyric.timestamp + Math.max(3, currentLyric.text.split(' ').length * 0.8))
    const lyricDuration = lyricEndTime - lyricStartTime
    const timeSinceLyricStart = currentTime - lyricStartTime
    
    if (timeSinceLyricStart < 0) return { lyricIndex: currentLyricIndex, wordIndex: 0, transitionState: 'none' }
    
    // Check if we're in transition phase (between end time and next start time)
    if (currentTime >= lyricEndTime && nextLyric && nextLyric.timestamp !== null) {
      const nextStartTime = nextLyric.timestamp
      if (currentTime < nextStartTime) {
        // We're in the gap/transition period
        const gapDuration = nextStartTime - lyricEndTime
        const transitionProgress = (currentTime - lyricEndTime) / gapDuration
        const words = currentLyric.text.split(' ')
        
        return { 
          lyricIndex: currentLyricIndex, 
          wordIndex: words.length, 
          transitionState: 'transitioning',
          transitionProgress,
          nextLyricIndex: currentLyricIndex + 1
        }
      }
    }
    
    // If current time is past end time but no next lyric, show all words as revealed
    if (currentTime >= lyricEndTime) {
      const words = currentLyric.text.split(' ')
      return { lyricIndex: currentLyricIndex, wordIndex: words.length, transitionState: 'ended' }
    }
    
    // Calculate word reveal progress only within start-end duration
    const progress = Math.min(1, timeSinceLyricStart / lyricDuration)
    const words = currentLyric.text.split(' ')
    const wordIndex = Math.floor(progress * words.length)
    
    return { lyricIndex: currentLyricIndex, wordIndex, transitionState: 'active' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Spin size="large" />
          <div className="mt-4 text-white text-lg">Đang tải dự án...</div>
        </motion.div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-lg">Không tìm thấy dự án</div>
        </div>
      </div>
    )
  }

  const { 
    lyricIndex: currentLyricIndex, 
    wordIndex: currentWordIndex, 
    transitionState, 
    transitionProgress,
    nextLyricIndex 
  } = getCurrentLyricState()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            className="text-white hover:bg-white/10 border-none"
            onClick={() => navigate('/saved')}
          >
            Quay lại
          </Button>
          <div className="text-center">
            <Title level={2} className="!text-white !mb-0">
              {project.title}
            </Title>
            <Text className="text-gray-300">
              {project.artist}
            </Text>
          </div>
          <div className="w-[100px]" /> {/* Spacer for centering */}
        </div>
      </motion.header>

      <div className="flex flex-col h-[calc(100vh-80px)]">
        <audio
          ref={audioRef}
          src={project.audioDataUrl}
          preload="metadata"
        />

        {/* Karaoke Display */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl"
          >
            <Card className="bg-black/20 backdrop-blur-lg border-white/10 min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-6 px-8 py-12">
                <AnimatePresence mode="wait">
                  {project.lyrics.map((lyric, index) => {
                    const isCurrentLine = index === currentLyricIndex
                    const isPreviousLine = index === currentLyricIndex - 1
                    const isNextLine = index === currentLyricIndex + 1
                    const isPassedLine = index < currentLyricIndex
                    const isTransitioning = transitionState === 'transitioning'
                    const isTransitionNextLine = isTransitioning && index === nextLyricIndex

                    // Only show current line and adjacent lines for better focus
                    const shouldShow = isCurrentLine || isPreviousLine || isNextLine || isTransitionNextLine ||
                                     (Math.abs(index - currentLyricIndex) <= 1)

                    if (!shouldShow) return null

                    let opacity = 0.3
                    let scale = 0.8
                    let fontSize = 'text-xl'
                    
                    if (isCurrentLine) {
                      opacity = 1
                      scale = 1.1
                      fontSize = 'text-4xl md:text-5xl'
                    } else if (isPreviousLine || isNextLine || isTransitionNextLine) {
                      opacity = 0.6
                      scale = 0.9
                      fontSize = 'text-2xl md:text-3xl'
                    } else if (isPassedLine) {
                      opacity = 0.4
                      scale = 0.8
                      fontSize = 'text-lg'
                    }

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity, 
                          scale,
                          y: 0
                        }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ 
                          duration: 0.5,
                          ease: "easeInOut"
                        }}
                        className={`${fontSize} font-bold leading-tight transition-all duration-500`}
                        style={isTransitionNextLine ? {
                          '--transition-progress': transitionProgress || 0
                        } : {}}
                      >
                        <div className="flex flex-wrap justify-center gap-2">
                          {lyric.text.split(' ').map((word, wordIndex) => {
                            let wordOpacity = 0.3
                            let wordColor = 'text-gray-400'
                            
                            if (isPassedLine || isPreviousLine) {
                              wordOpacity = 1
                              wordColor = 'text-purple-300'
                            } else if (isCurrentLine) {
                              if (transitionState === 'ended' || transitionState === 'transitioning') {
                                wordOpacity = 1
                                wordColor = 'text-white'
                              } else {
                                if (wordIndex < currentWordIndex) {
                                  wordOpacity = 1
                                  wordColor = 'text-white'
                                } else if (wordIndex === currentWordIndex) {
                                  wordOpacity = 1
                                  wordColor = 'text-yellow-300'
                                } else {
                                  wordOpacity = 0.4
                                  wordColor = 'text-gray-500'
                                }
                              }
                            } else if (isTransitionNextLine) {
                              wordOpacity = 0.7
                              wordColor = 'text-blue-300'
                            } else {
                              wordOpacity = 0.3
                              wordColor = 'text-gray-600'
                            }

                            return (
                              <motion.span
                                key={wordIndex}
                                className={`${wordColor} transition-all duration-300`}
                                style={{ opacity: wordOpacity }}
                                animate={wordIndex === currentWordIndex && isCurrentLine ? {
                                  scale: [1, 1.05, 1],
                                  transition: { duration: 0.5, repeat: Infinity }
                                } : {}}
                              >
                                {word}
                              </motion.span>
                            )
                          })}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Audio Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/20 backdrop-blur-lg border-t border-white/10 px-6 py-6"
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                type="text"
                icon={<StepBackwardOutlined />}
                className="text-white hover:bg-white/10 border-none"
                size="large"
                onClick={() => handleSeek(-10)}
              />
              
              <Button
                type="primary"
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                className="bg-gradient-to-r from-purple-500 to-pink-500 border-none w-16 h-16 text-2xl"
                shape="circle"
                onClick={togglePlayPause}
              />
              
              <Button
                type="text"
                icon={<StepForwardOutlined />}
                className="text-white hover:bg-white/10 border-none"
                size="large"
                onClick={() => handleSeek(10)}
              />
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-4">
              <Text className="text-white font-mono text-sm min-w-[45px]">
                {formatTime(currentTime)}
              </Text>
              
              <div className="flex-1">
                <Slider
                  value={getProgressPercentage()}
                  onChange={(value) => {
                    if (audioRef.current && duration > 0) {
                      const newTime = (value / 100) * duration
                      audioRef.current.currentTime = newTime
                    }
                  }}
                  tooltip={{ open: false }}
                  trackStyle={{ 
                    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                  }}
                  handleStyle={{
                    borderColor: '#8b5cf6',
                    backgroundColor: '#8b5cf6'
                  }}
                  railStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                />
              </div>
              
              <Text className="text-white font-mono text-sm min-w-[45px]">
                {formatTime(duration)}
              </Text>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-3">
              <SoundOutlined className="text-white" />
              <div className="w-32">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={(value) => {
                    setVolume(value)
                    if (audioRef.current) {
                      audioRef.current.volume = value
                    }
                  }}
                  tooltip={{ 
                    formatter: (value) => `${Math.round(value * 100)}%`
                  }}
                  trackStyle={{ 
                    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                  }}
                  handleStyle={{
                    borderColor: '#8b5cf6',
                    backgroundColor: '#8b5cf6'
                  }}
                  railStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProjectPreview
