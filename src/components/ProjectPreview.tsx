import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Slider, Typography, Card, Spin, Modal } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined, SoundOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import localforage from 'localforage'
import type { SavedProject } from '../types'

const { Title, Text } = Typography

interface LyricState {
    lyricIndex: number
    wordIndex: number
    transitionState: 'none' | 'active' | 'ended' | 'transitioning'
    transitionProgress?: number
    nextLyricIndex?: number
}

const ProjectPreview: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()
    const audioRef = useRef<HTMLAudioElement>(null)

    const [project, setProject] = useState<SavedProject | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [duration, setDuration] = useState<number>(0)
    const [isPlaying, setIsPlaying] = useState<boolean>(false)
    const [volume, setVolume] = useState<number>(1)

    useEffect(() => {
        if (projectId) {
            loadProject()
        }
    }, [projectId])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio || !project?.audioDataUrl) return

        const updateTime = (): void => setCurrentTime(audio.currentTime)
        const updateDuration = (): void => setDuration(audio.duration)
        const handlePlay = (): void => setIsPlaying(true)
        const handlePause = (): void => setIsPlaying(false)
        const handleEnded = (): void => setIsPlaying(false)

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

    const loadProject = useCallback(async (): Promise<void> => {
        try {
            const projectData = await localforage.getItem(`project_${projectId}`) as SavedProject | null
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
    }, [projectId, navigate])

    const togglePlayPause = useCallback((): void => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
    }, [isPlaying])

    const handleSeek = useCallback((seconds: number): void => {
        const audio = audioRef.current
        if (!audio) return

        if (seconds > 0) {
            audio.currentTime = Math.min(duration, audio.currentTime + seconds)
        } else {
            audio.currentTime = Math.max(0, audio.currentTime + seconds)
        }
    }, [duration])

    const formatTime = useCallback((time: number): string => {
        if (!time || isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }, [])

    const getProgressPercentage = useCallback((): number => {
        return duration > 0 ? (currentTime / duration) * 100 : 0
    }, [currentTime, duration])

    // Memoized karaoke effect calculation
    const getCurrentLyricState = useMemo((): LyricState => {
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
        const lyricStartTime = currentLyric.timestamp!
        // Use endTime if available, otherwise fallback to estimated duration
        const lyricEndTime = currentLyric.endTime !== null && currentLyric.endTime !== undefined
            ? currentLyric.endTime
            : (lyricStartTime + Math.max(3, currentLyric.text.split(' ').length * 0.8))
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
    }, [project?.lyrics, currentTime])

    // Extract current lyric state from memoized calculation
    const {
        lyricIndex: currentLyricIndex,
        wordIndex: currentWordIndex,
        transitionState
    } = getCurrentLyricState

    // Memoized scroll position calculation
    const scrollY = useMemo(() => {
        return currentLyricIndex >= 0 ? 150 - (currentLyricIndex * 100) - 50 : 150 - 50
    }, [currentLyricIndex])

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" translate="no">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-6 py-4"
            >
                <div className="text-center" translate="no">
                    <Title level={2} className="!text-white !mb-0" translate="no">
                        {project.title}
                    </Title>
                    <Text className="text-gray-300" translate="no">
                        {project.artist}
                    </Text>
                </div>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="text-white hover:bg-white/10 border-none"
                        onClick={() => navigate('/saved')}
                    >
                        Quay lại
                    </Button>

                    <div className="w-[100px]" /> {/* Spacer for centering */}
                </div>
            </motion.header>

            <div className="flex flex-col h-[calc(100vh-80px)]">
                <audio
                    ref={audioRef}
                    src={project.audioDataUrl || undefined}
                    preload="metadata"
                />

                {/* Karaoke Display */}
                <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-5xl"
                    >
                        <Card className="bg-black/20 backdrop-blur-lg border-white/10 min-h-[500px] flex items-center justify-center overflow-hidden"
                            styles={{
                                body: {
                                    width: '100%',
                                }
                            }}
                        >
                            <div className="w-full h-full flex flex-col justify-center px-8 py-12 overflow-hidden" >
                                {/* Karaoke Container - 3 lines with smooth scrolling */}
                                <div
                                    className="relative h-[300px] overflow-hidden"
                                    id="karaoke-container"
                                    style={{
                                        transform: 'translateZ(0)', // Force GPU acceleration
                                        backfaceVisibility: 'hidden',
                                        perspective: '1000px'
                                    }}
                                >
                                    <motion.div
                                        className="absolute top-0 left-0 w-full flex flex-col"
                                        animate={{
                                            y: scrollY
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.4, 0.0, 0.2, 1], // Improved easing for smoother animation
                                            type: "tween"
                                        }}
                                    >
                                        {project.lyrics.map((lyric, index) => {
                                            const relativePosition = index - currentLyricIndex;

                                            let scale = 0.7;
                                            let opacity = 0.2;
                                            let fontSize = 'text-base';
                                            let textColor = 'text-gray-500';

                                            if (relativePosition === -1) {
                                                scale = 0.9;
                                                opacity = 0.6;
                                                fontSize = 'text-2xl';
                                                textColor = 'text-purple-300';
                                            } else if (relativePosition === 0) {
                                                scale = 1;
                                                opacity = 1;
                                                fontSize = 'text-3xl md:text-4xl font-bold';
                                                textColor = 'text-white';
                                            } else if (relativePosition === 1) {
                                                scale = 0.9;
                                                opacity = 0.7;
                                                fontSize = 'text-2xl';
                                                textColor = 'text-blue-300';
                                            } else if (Math.abs(relativePosition) === 2) {
                                                scale = 0.8;
                                                opacity = 0.4;
                                                fontSize = 'text-xl';
                                                textColor = 'text-gray-400';
                                            } else if (Math.abs(relativePosition) > 2) {
                                                scale = 0.75;
                                                opacity = 0;
                                                fontSize = 'text-lg';
                                                textColor = 'text-gray-500';
                                            }

                                            return (
                                                <motion.div
                                                    key={index}
                                                    className={`h-[100px] flex items-center justify-center px-4 ${fontSize} ${textColor} leading-tight`}
                                                    animate={{
                                                        scale,
                                                        opacity
                                                    }}
                                                    transition={{
                                                        duration: 0.4,
                                                        ease: [0.4, 0.0, 0.2, 1],
                                                        type: "tween"
                                                    }}
                                                    style={{
                                                        willChange: 'transform, opacity' // Optimize for GPU acceleration
                                                    }}
                                                >
                                                    <div className="text-center max-w-4xl" translate="no">
                                                        {relativePosition === 0 ? (
                                                            <div className="flex flex-wrap justify-center gap-2" translate="no">
                                                                {lyric.text.split(' ').map((word, wordIndex) => {
                                                                    let wordOpacity = 0.4;
                                                                    let wordColor = 'text-gray-400';
                                                                    let shouldGlow = false;

                                                                    if (transitionState === 'ended' || transitionState === 'transitioning') {
                                                                        wordOpacity = 1;
                                                                        wordColor = 'text-white';
                                                                    } else if (transitionState === 'active') {
                                                                        if (wordIndex < currentWordIndex) {
                                                                            wordOpacity = 1;
                                                                            wordColor = 'text-white';
                                                                        } else if (wordIndex === currentWordIndex) {
                                                                            wordOpacity = 1;
                                                                            wordColor = 'text-yellow-300';
                                                                            shouldGlow = true;
                                                                        } else {
                                                                            wordOpacity = 0.5;
                                                                            wordColor = 'text-gray-400';
                                                                        }
                                                                    } else {
                                                                        wordOpacity = 0.7;
                                                                        wordColor = 'text-gray-300';
                                                                    }

                                                                    return (
                                                                        <motion.span
                                                                            key={`word-${wordIndex}`}
                                                                            className={`${wordColor} ${shouldGlow ? 'drop-shadow-lg' : ''}`}
                                                                            translate="no"
                                                                            style={{
                                                                                opacity: wordOpacity,
                                                                                textShadow: shouldGlow ? '0 0 20px rgba(253, 224, 71, 0.8)' : 'none',
                                                                                willChange: shouldGlow ? 'transform' : 'auto'
                                                                            }}
                                                                            animate={shouldGlow ? {
                                                                                scale: [1, 1.005, 1],
                                                                            } : {}}
                                                                            transition={{
                                                                                duration: 1.2,
                                                                                repeat: shouldGlow ? Infinity : 0,
                                                                                ease: "easeInOut",
                                                                                type: "tween"
                                                                            }}
                                                                        >
                                                                            {word}
                                                                        </motion.span>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <motion.span
                                                                translate="no"
                                                                animate={{ opacity }}
                                                                transition={{
                                                                    duration: 0.4,
                                                                    ease: [0.4, 0.0, 0.2, 1]
                                                                }}
                                                                style={{
                                                                    willChange: 'opacity'
                                                                }}
                                                            >
                                                                {lyric.text}
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {currentLyricIndex === -1 && (
                                            <div className="h-[100px] flex items-center justify-center text-4xl md:text-5xl font-bold text-gray-500" translate="no">
                                                <motion.span
                                                    translate="no"
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    Chờ bài hát bắt đầu...
                                                </motion.span>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
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
                                    styles={{
                                        track: {
                                            background: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                                        },
                                        handle: {
                                            borderColor: '#8b5cf6',
                                            backgroundColor: '#8b5cf6'
                                        },
                                        rail: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                        }
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
                                        formatter: (value) => `${Math.round((value ?? 0) * 100)}%`
                                    }}
                                    styles={{
                                        track: {
                                            background: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                                        },
                                        handle: {
                                            borderColor: '#8b5cf6',
                                            backgroundColor: '#8b5cf6'
                                        },
                                        rail: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                        }
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
