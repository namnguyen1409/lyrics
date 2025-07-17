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
  Select,
  Modal
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
  QuestionCircleOutlined
} from '@ant-design/icons'
import localforage from 'localforage'
import type { ProjectData, LyricLine } from '../types'
import LyricItem from './LyricItem'

const { Title, Text } = Typography
const { Option } = Select

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
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false)

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
          let initialLyrics: LyricLine[]
          if (parsed.isEditing && parsed.lyrics[0] && typeof parsed.lyrics[0] === 'object') {
            // Editing existing project - use existing lyrics with timestamps
            initialLyrics = parsed.lyrics.map((lyric: LyricLine, index: number) => ({
              id: lyric.id || `lyric-${index}-${Date.now()}`,
              text: lyric.text,
              timestamp: lyric.timestamp,
              endTime: lyric.endTime || null,
              phonetic: lyric.phonetic || '',
              translation: lyric.translation || '',
              notes: lyric.notes || '',
              additionalLines: lyric.additionalLines || []
            }))
            console.log('Loading existing project with timestamps')
          } else {
            // New project - convert text array or LyricLine array to full lyrics objects
            initialLyrics = parsed.lyrics.map((line: string | LyricLine, index: number) => ({
              id: typeof line === 'object' && line.id ? line.id : `lyric-${index}-${Date.now()}`,
              text: typeof line === 'string' ? line : line.text, // Handle both string and object
              timestamp: index === 0 ? 0 : null,
              endTime: null,
              phonetic: typeof line === 'object' && line.phonetic ? line.phonetic : '',
              translation: typeof line === 'object' && line.translation ? line.translation : '',
              notes: typeof line === 'object' && line.notes ? line.notes : '',
              additionalLines: typeof line === 'object' && line.additionalLines ? line.additionalLines : []
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
            {
              id: '1',
              text: 'This is the first line',
              timestamp: null,
              endTime: null,
              phonetic: '',
              translation: '',
              notes: '',
              additionalLines: []
            },
            {
              id: '2', 
              text: 'This is the second line',
              timestamp: null,
              endTime: null,
              phonetic: '',
              translation: '',
              notes: '',
              additionalLines: []
            },
            {
              id: '3',
              text: 'This is the third line', 
              timestamp: null,
              endTime: null,
              phonetic: '',
              translation: '',
              notes: '',
              additionalLines: []
            },
            {
              id: '4',
              text: 'This is the fourth line',
              timestamp: null,
              endTime: null,
              phonetic: '',
              translation: '',
              notes: '',
              additionalLines: []
            }
          ],
          audioDataUrl: null,
          audioFileName: 'test.mp3',
          audioFileType: 'audio/mpeg'
        }

        // Set test data and proceed
        setProjectData(testData)
        const initialLyrics = testData.lyrics.map((lyric) => ({
          ...lyric
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
      // Check if element is already in view to avoid unnecessary scrolling
      const rect = element.getBoundingClientRect()
      const containerRect = lyricsListRef.current.getBoundingClientRect()
      
      const isInView = rect.top >= containerRect.top && 
                      rect.bottom <= containerRect.bottom

      if (!isInView) {
        // Use requestAnimationFrame for smoother animation
        requestAnimationFrame(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
        })
      }
    }
  }, [])

  // Optimized throttled scroll with debounce
  const throttledScrollToLine = useCallback((index: number) => {
    if (throttledScrollRef.current) {
      clearTimeout(throttledScrollRef.current)
    }

    throttledScrollRef.current = setTimeout(() => {
      scrollToHighlightedLine(index)
    }, 150) // Increased timeout to reduce scroll frequency
  }, [scrollToHighlightedLine])

  // Optimized update active line function with debouncing
  const updateActiveLine = useCallback((currentTime: number): void => {
    const activeIndex = findActiveIndex(currentTime)
    if (activeIndex !== currentLyricIndex) {
      setCurrentLyricIndex(activeIndex)
      // Only scroll if the change is significant (avoid micro-scrolling)
      if (Math.abs(activeIndex - currentLyricIndex) >= 1) {
        throttledScrollToLine(activeIndex)
      }
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

  // Lyrics management functions
  const addLineAbove = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics.splice(index, 0, {
        id: `lyric-${Date.now()}-${Math.random()}`,
        text: '',
        timestamp: null,
        endTime: null,
        phonetic: '',
        translation: '',
        notes: '',
        additionalLines: []
      })
      return newLyrics
    })
    // Update current index if needed
    if (index <= currentLyricIndex) {
      setCurrentLyricIndex(currentLyricIndex + 1)
    }
    message.success('Đã thêm dòng mới phía trên')
  }, [currentLyricIndex])

  const addLineBelow = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics.splice(index + 1, 0, {
        id: `lyric-${Date.now()}-${Math.random()}`,
        text: '',
        timestamp: null,
        endTime: null,
        phonetic: '',
        translation: '',
        notes: '',
        additionalLines: []
      })
      return newLyrics
    })
    // Update current index if needed
    if (index < currentLyricIndex) {
      setCurrentLyricIndex(currentLyricIndex + 1)
    }
    message.success('Đã thêm dòng mới phía dưới')
  }, [currentLyricIndex])

  const deleteLine = useCallback((index: number) => {
    if (syncedLyrics.length <= 1) {
      message.warning('Không thể xóa dòng cuối cùng')
      return
    }

    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics.splice(index, 1)
      return newLyrics
    })

    // Update current index if needed
    if (index < currentLyricIndex) {
      setCurrentLyricIndex(currentLyricIndex - 1)
    } else if (index === currentLyricIndex && currentLyricIndex >= syncedLyrics.length - 1) {
      setCurrentLyricIndex(Math.max(0, syncedLyrics.length - 2))
    }
    
    message.success(`Đã xóa dòng ${index + 1}`)
  }, [syncedLyrics.length, currentLyricIndex])

  const updateLyricText = useCallback((index: number, newText: string) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = {
        ...newLyrics[index],
        text: newText
      }
      return newLyrics
    })
    message.success(`Đã cập nhật nội dung dòng ${index + 1}`)
  }, [])

  // Phonetic, translation, notes update functions
  const updateLyricPhonetic = useCallback((index: number, newPhonetic: string) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = {
        ...newLyrics[index],
        phonetic: newPhonetic
      }
      return newLyrics
    })
    message.success(`Đã cập nhật phiên âm dòng ${index + 1}`)
  }, [])

  const updateLyricTranslation = useCallback((index: number, newTranslation: string) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = {
        ...newLyrics[index],
        translation: newTranslation
      }
      return newLyrics
    })
    message.success(`Đã cập nhật bản dịch dòng ${index + 1}`)
  }, [])

  const updateLyricNotes = useCallback((index: number, newNotes: string) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = {
        ...newLyrics[index],
        notes: newNotes
      }
      return newLyrics
    })
    message.success(`Đã cập nhật ghi chú dòng ${index + 1}`)
  }, [])

  const saveProject = useCallback(async () => {
    if (!projectData) return

    setIsSaving(true)
    try {
      // Check if this is editing an existing project
      const isEditing = projectData.isEditing && projectData.projectId
      const projectId = isEditing ? projectData.projectId : Date.now().toString()

      const projectToSave = {
        id: projectId,
        title: projectData.songTitle,
        artist: projectData.artist,
        lyrics: syncedLyrics,
        createdAt: isEditing ?
          // Keep original creation date if editing
          ((await localforage.getItem(`project_${projectId}`)) as any)?.createdAt || new Date().toISOString() :
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    // Don't handle keyboard shortcuts when user is typing in an input field
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

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
    } else if (e.code === 'KeyS' && !e.ctrlKey) {
      e.preventDefault()
      setTimestamp(currentLyricIndex)
    } else if (e.code === 'Enter' && e.shiftKey) {
      e.preventDefault()
      addLineAbove(currentLyricIndex)
    } else if (e.code === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      addLineBelow(currentLyricIndex)
    } else if (e.code === 'Delete' && e.ctrlKey) {
      e.preventDefault()
      deleteLine(currentLyricIndex)
    } else if (e.code === 'F1') {
      e.preventDefault()
      setShowShortcuts(true)
    }
  }, [togglePlayPause, goToPreviousLine, goToNextLine, seekBackward, seekForward, setEndTime, setTimestamp, addLineAbove, addLineBelow, deleteLine, currentLyricIndex])

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

  // Optimized auto scroll when current lyric index changes - with less frequency
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToHighlightedLine(currentLyricIndex)
    }, 100) // Increased timeout to reduce scroll frequency

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div 
          className="container mx-auto px-4 py-6 min-h-screen max-w-7xl"
          style={{ contain: 'layout style' }} // CSS containment for layout performance
        >
          {/* Loading Skeleton - exact dimensions as final layout */}
          <div className="mb-6 h-[120px]">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full flex items-center">
              <div className="w-full flex justify-between items-center">
                <div className="flex-1">
                  <div className="h-8 bg-white/10 rounded-lg mb-2 animate-pulse w-3/4" />
                  <div className="h-4 bg-white/10 rounded animate-pulse w-1/3" />
                </div>
                <div className="flex space-x-4">
                  <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            </Card>
          </div>

          <Row gutter={[24, 24]} style={{ alignItems: 'flex-start' }}>
            {/* Audio Controls Skeleton - exact same dimensions */}
            <Col xs={24} lg={8}>
              <Card 
                className="bg-white/10 backdrop-blur-lg border-white/20 h-[580px]"
                title={<div className="h-5 bg-white/10 rounded animate-pulse w-1/2" />}
              >
                <div className="h-full flex flex-col justify-between">
                  {/* Play button skeleton */}
                  <div className="text-center">
                    <div className="h-16 w-16 bg-white/10 rounded-full mx-auto animate-pulse" />
                  </div>
                  
                  {/* Progress bar skeleton */}
                  <div className="h-[60px] space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="h-4 bg-white/10 rounded animate-pulse" />
                  </div>
                  
                  {/* Speed control skeleton */}
                  <div className="h-[80px] space-y-2">
                    <div className="h-4 bg-white/10 rounded animate-pulse w-1/3" />
                    <div className="h-8 bg-white/10 rounded animate-pulse" />
                  </div>
                  
                  {/* Control buttons skeleton */}
                  <div className="h-[140px] grid grid-cols-2 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 bg-white/10 rounded animate-pulse" />
                    ))}
                  </div>
                  
                  {/* Progress info skeleton */}
                  <div className="h-[80px] space-y-2 text-center">
                    <div className="h-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 bg-white/10 rounded animate-pulse w-1/4 mx-auto" />
                  </div>
                </div>
              </Card>
            </Col>

            {/* Lyrics List Skeleton - exact same dimensions */}
            <Col xs={24} lg={16}>
              <Card 
                className="bg-white/10 backdrop-blur-lg border-white/20 h-[680px]"
                title={<div className="h-5 bg-white/10 rounded animate-pulse w-1/2" />}
              >
                <div className="h-[600px] overflow-hidden space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-[70px] bg-white/10 rounded-lg animate-pulse flex items-center p-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
                        <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Loading indicator */}
          <div className="fixed bottom-8 right-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-4xl text-purple-400"
            >
              <PlayCircleOutlined />
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="container mx-auto px-4 py-6 min-h-screen max-w-7xl"
        style={{ 
          contain: 'layout style', // CSS containment for better layout performance
          willChange: 'auto' // Remove will-change when not needed
        }}
      >
        {/* Header - Fixed height to prevent layout shift */}
        <div className="mb-6 h-[120px]">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full flex items-center">
            <Row justify="space-between" align="middle" className="w-full">
              <Col>
                <div>
                  <Title level={3} className="!text-white !mb-1 leading-tight">
                    {projectData.songTitle} {projectData.isEditing && <span className="text-orange-400">(Đang chỉnh sửa)</span>}
                  </Title>
                  <Text className="text-gray-300">{projectData.artist}</Text>
                </div>
              </Col>
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

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      type="default"
                      icon={<QuestionCircleOutlined />}
                      size="large"
                      onClick={() => setShowShortcuts(true)}
                    >
                      Phím tắt
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
        </div>

        <Row gutter={[24, 24]} style={{ alignItems: 'flex-start', minHeight: '680px' }}>
          {/* Audio Controls - Fixed height */}
          <Col xs={24} lg={8} className="flex">
            <div className="w-full">
              <Card
                className="bg-white/10 backdrop-blur-lg border-white/20 h-[580px] w-full" // Fixed height
                title={<Text className="text-white font-semibold">Điều khiển âm thanh</Text>}
                style={{ contain: 'layout style' }} // CSS containment
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
            </div>
          </Col>

          {/* Lyrics List - Fixed height */}
          <Col xs={24} lg={16} className="flex">
            <div className="w-full">
              <Card
                className="bg-white/10 backdrop-blur-lg border-white/20 h-[680px] w-full" // Fixed height
                title={<Text className="text-white font-semibold">Danh sách lời bài hát</Text>}
                style={{ contain: 'layout style' }} // CSS containment
              >
                <div
                  ref={lyricsListRef}
                  className="h-[600px] overflow-y-auto pr-2" // Fixed height instead of max-height
                  style={{
                    scrollBehavior: 'smooth',
                    scrollPaddingTop: '40px',
                    scrollPaddingBottom: '40px',
                    contain: 'layout style paint', // CSS containment for scroll performance
                    // Optimized CSS for better scrolling performance
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(139, 92, 246, 0.3) transparent',
                    // Performance improvements
                    willChange: 'scroll-position',
                    transform: 'translateZ(0)', // Hardware acceleration
                    WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
                    // Reduce repaints
                    backfaceVisibility: 'hidden',
                    perspective: '1000px'
                  }}
                >
                  {syncedLyrics.map((lyric, index) => (
                    <LyricItem
                      key={`lyric-${index}-${lyric.text.slice(0, 10)}`} // Stable key for better performance
                      lyric={lyric}
                      index={index}
                      isActive={index === currentLyricIndex}
                      onLyricClick={handleLyricClick}
                      onSetTimestamp={setTimestamp}
                      onSetEndTime={setEndTime}
                      onClearTimestamp={clearTimestamp}
                      onAddLineAbove={addLineAbove}
                      onAddLineBelow={addLineBelow}
                      onDeleteLine={deleteLine}
                      onUpdateText={updateLyricText}
                      onUpdatePhonetic={updateLyricPhonetic}
                      onUpdateTranslation={updateLyricTranslation}
                      onUpdateNotes={updateLyricNotes}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </Col>
        </Row>

        {/* Shortcuts Modal */}
        <Modal
          title="Phím tắt"
          open={showShortcuts}
          onCancel={() => setShowShortcuts(false)}
          footer={null}
          width={600}
        >
          <div className="space-y-4">
            <div>
              <Title level={5}>Điều khiển phát nhạc</Title>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Phát/Tạm dừng</span>
                  <Tag>Space</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Tua lùi 5 giây</span>
                  <Tag>←</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Tua tới 5 giây</span>
                  <Tag>→</Tag>
                </div>
              </div>
            </div>

            <div>
              <Title level={5}>Điều khiển lyrics</Title>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Dòng trước</span>
                  <Tag>↑</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Dòng sau</span>
                  <Tag>↓</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Đặt timestamp</span>
                  <Tag>S</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Đặt thời gian kết thúc</span>
                  <Tag>E</Tag>
                </div>
              </div>
            </div>

            <div>
              <Title level={5}>Quản lý lyrics</Title>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Thêm dòng phía trên</span>
                  <Tag>Shift + Enter</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Thêm dòng phía dưới</span>
                  <Tag>Ctrl + Enter</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Xóa dòng hiện tại</span>
                  <Tag>Ctrl + Delete</Tag>
                </div>
                <div className="flex justify-between">
                  <span>Hiển thị phím tắt</span>
                  <Tag>F1</Tag>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default LyricsSynchronizer
