import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Upload, Button, Typography, message, Slider, Select, Tooltip } from 'antd'
import { ArrowLeftOutlined, UploadOutlined, SoundOutlined, FileTextOutlined, PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined, FormatPainterOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'
import type { UploadFile } from 'antd'
import type { ProjectData, TextFormat, LyricLine } from '../types'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface FormValues {
    songTitle: string
    artist: string
    lyrics: string
}

const AudioLyricsInput: React.FC = () => {
    const navigate = useNavigate()
    const [form] = Form.useForm<FormValues>()
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [audioDataUrl, setAudioDataUrl] = useState<string>('')
    const [uploading, setUploading] = useState<boolean>(false)

    // Audio preview states
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [duration, setDuration] = useState<number>(0)
    const [volume, setVolume] = useState<number>(1)

    // Text formatting states
    const [textFormat, setTextFormat] = useState<TextFormat>('original')
    const [groupingMode, setGroupingMode] = useState<'line' | 'paragraph' | 'separator'>('line')

    const handleAudioUpload = (file: UploadFile): boolean => {
        setUploading(true)

        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'video/mp4', 'video/webm']

        if (!file.type || !validTypes.includes(file.type)) {
            message.error('Vui lòng chọn file âm thanh hoặc video hợp lệ')
            setUploading(false)
            return false
        }

        const fileObj = file.originFileObj || file as unknown as File
        const reader = new FileReader()
        reader.onload = (e) => {
            const result = e.target?.result
            if (typeof result === 'string') {
                setAudioDataUrl(result)
                setAudioFile(fileObj)
                setUploading(false)
                message.success('Tải file thành công!')

                // Reset audio states
                setIsPlaying(false)
                setCurrentTime(0)
                setDuration(0)
            }
        }
        reader.onerror = () => {
            message.error('Có lỗi xảy ra khi đọc file')
            setUploading(false)
        }
        reader.readAsDataURL(fileObj)

        return false // Prevent auto upload
    }

    // Audio preview functions
    const togglePlayPause = (): void => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
    }

    const handleSeek = (seconds: number): void => {
        const audio = audioRef.current
        if (!audio) return

        if (seconds > 0) {
            audio.currentTime = Math.min(duration, audio.currentTime + seconds)
        } else {
            audio.currentTime = Math.max(0, audio.currentTime + seconds)
        }
    }

    const handleTimeUpdate = (): void => {
        const audio = audioRef.current
        if (audio) {
            setCurrentTime(audio.currentTime)
        }
    }

    const handleLoadedMetadata = (): void => {
        const audio = audioRef.current
        if (audio) {
            setDuration(audio.duration)
        }
    }

    const handlePlay = (): void => setIsPlaying(true)
    const handlePause = (): void => setIsPlaying(false)
    const handleEnded = (): void => setIsPlaying(false)

    const formatTime = (time: number): string => {
        if (!time || isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const getProgressPercentage = (): number => {
        return duration > 0 ? (currentTime / duration) * 100 : 0
    }

    // Text formatting function
    const formatText = (text: string, format: TextFormat): string => {
        if (!text) return text

        switch (format) {
            case 'lowercase':
                return text.toLocaleLowerCase('vi-VN')

            case 'uppercase':
                return text.toLocaleUpperCase('vi-VN')

            case 'sentence':
                return text
                    .split('\n')
                    .map((line) => {
                        const trimmed = line.trimStart()
                        if (!trimmed) return ''
                        return trimmed[0].toLocaleUpperCase('vi-VN') + trimmed.slice(1).toLocaleLowerCase('vi-VN')
                    })
                    .join('\n')

            case 'title':
                return text.replace(/\p{L}+/gu, (word) =>
                    word[0].toLocaleUpperCase('vi-VN') + word.slice(1).toLocaleLowerCase('vi-VN')
                )

            case 'original':
            default:
                return text
        }
    }

    const applyTextFormat = (): void => {
        const currentLyrics = form.getFieldValue('lyrics')
        if (currentLyrics && textFormat !== 'original') {
            const formattedLyrics = formatText(currentLyrics, textFormat)
            form.setFieldsValue({ lyrics: formattedLyrics })
            message.success('Đã áp dụng định dạng văn bản')
        }
    }

    const previewLyrics = (): LyricLine[] => {
        const currentLyrics = form.getFieldValue('lyrics')
        if (!currentLyrics?.trim()) return []
        return processLyrics(currentLyrics, groupingMode)
    }

    // Auto-suggest grouping mode based on content analysis
    const analyzeAndSuggestGrouping = (text: string): 'line' | 'paragraph' | 'separator' => {
        if (!text?.trim()) return 'line'

        const lines = text.split('\n').filter(line => line.trim().length > 0)
        const totalLines = lines.length
        const emptyLineCount = text.split(/\n\s*\n/).length - 1
        const separatorCount = text.split(/\n\s*(?:---|===)\s*\n/).length - 1

        // Check for separators first
        if (separatorCount > 0) {
            return 'separator'
        }

        // Check for paragraph structure
        if (emptyLineCount > 0 && totalLines > emptyLineCount * 2) {
            // Has empty lines and reasonable content density
            return 'paragraph'
        }

        // Check for potential multi-line lyrics (phonetic patterns)
        const phoneticPatterns = [
            /\([^)]+\)/g, // Parentheses (romanization)
            /\[[^\]]+\]/g, // Square brackets
            /【[^】]+】/g, // Chinese brackets
            /\d+\./g, // Numbered lines
        ]

        let phoneticIndicators = 0
        phoneticPatterns.forEach(pattern => {
            if (pattern.test(text)) phoneticIndicators++
        })

        // If many phonetic indicators, suggest paragraph grouping
        if (phoneticIndicators >= 2 && totalLines > 10) {
            return 'paragraph'
        }

        // Default to line-by-line
        return 'line'
    }

    const getGroupingSuggestion = (): string => {
        const currentLyrics = form.getFieldValue('lyrics')
        if (!currentLyrics?.trim()) return ''

        const suggested = analyzeAndSuggestGrouping(currentLyrics)
        if (suggested !== groupingMode) {
            const suggestions = {
                'line': 'Gợi ý: Sử dụng "Mỗi dòng là một lời"',
                'paragraph': 'Gợi ý: Phát hiện phiên âm/bính âm - nên dùng "Gom theo đoạn văn"',
                'separator': 'Gợi ý: Phát hiện dấu phân cách - nên dùng "Gom theo dấu phân cách"'
            }
            return suggestions[suggested]
        }
        return ''
    }

    // Enhanced lyrics processing function that supports multi-line content
    const processLyrics = (text: string, mode: 'line' | 'paragraph' | 'separator'): LyricLine[] => {
        if (!text?.trim()) return []

        let sections: string[] = []

        switch (mode) {
            case 'line':
                // Mỗi dòng là một lời (cách truyền thống)
                sections = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                break

            case 'paragraph':
                // Gom các dòng liên tiếp thành một lời (phân cách bởi dòng trống)
                sections = text.split(/\n\s*\n/)
                    .map(paragraph => paragraph.trim())
                    .filter(paragraph => paragraph.length > 0)
                break

            case 'separator':
                // Gom theo dấu phân cách "---" hoặc "===" 
                sections = text.split(/\n\s*(?:---|===)\s*\n/)
                    .map(section => section.trim())
                    .filter(section => section.length > 0)
                break

            default:
                return []
        }

        // Convert sections to LyricLine objects with enhanced parsing
        return sections.map((section, index) => {
            const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0)
            const mainText = lines[0] || ''
            
            // Detect and extract additional information
            let phonetic = ''
            let translation = ''
            let notes = ''
            const additionalLines: { type: 'phonetic' | 'translation' | 'note' | 'custom', text: string, label?: string }[] = []

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i]
                
                // Detect phonetic (in parentheses)
                if (/^\([^)]+\)$/.test(line)) {
                    phonetic = line.slice(1, -1) // Remove parentheses
                    additionalLines.push({ type: 'phonetic', text: phonetic })
                }
                // Detect translation (in square brackets)
                else if (/^\[[^\]]+\]$/.test(line)) {
                    translation = line.slice(1, -1) // Remove brackets
                    additionalLines.push({ type: 'translation', text: translation })
                }
                // Detect notes (starting with #, //, or Note:)
                else if (/^(#|\/\/|Note:|Ghi chú:)/.test(line)) {
                    notes = line.replace(/^(#|\/\/|Note:|Ghi chú:)\s*/, '')
                    additionalLines.push({ type: 'note', text: notes })
                }
                // Other lines as custom content
                else {
                    additionalLines.push({ type: 'custom', text: line })
                }
            }

            return {
                id: `lyric-${index}`,
                text: mainText,
                timestamp: null,
                endTime: null,
                isActive: false,
                phonetic: phonetic || undefined,
                translation: translation || undefined,
                notes: notes || undefined,
                additionalLines: additionalLines.length > 0 ? additionalLines : undefined
            }
        })
    }

    const handleSubmit = async (values: FormValues): Promise<void> => {
        if (!audioFile) {
            message.error('Vui lòng chọn file âm thanh')
            return
        }

        if (!values.lyrics?.trim()) {
            message.error('Vui lòng nhập lời bài hát')
            return
        }

        const lyrics = processLyrics(values.lyrics, groupingMode)

        if (lyrics.length === 0) {
            message.error('Vui lòng nhập ít nhất một lời bài hát')
            return
        }

        try {
            // Generate unique ID for this session
            const sessionId = uuidv4()

            // Save audio data to LocalForage (IndexedDB) to avoid sessionStorage quota
            await localforage.setItem(`temp_audio_${sessionId}`, audioDataUrl)

            // Create project data with reference to audio in LocalForage
            const projectData: ProjectData = {
                id: sessionId,
                songTitle: values.songTitle || 'Untitled',
                artist: values.artist || 'Unknown Artist',
                lyrics,
                audioFile: audioFile,
                audioDataUrl: '', // Empty to save space
                audioFileName: audioFile.name,
                audioFileType: audioFile.type,
                tempAudioId: sessionId, // Reference to audio in LocalForage
                groupingMode: groupingMode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            // Save lightweight project data to sessionStorage
            sessionStorage.setItem('currentProject', JSON.stringify(projectData))
            navigate('/sync')
        } catch (error) {
            console.error('Error saving project data:', error)
            message.error('Có lỗi xảy ra khi lưu dự án. Vui lòng thử lại.')
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut" as const
            }
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-6 py-4"
            >
                <Title level={1} className="!text-white !mb-0">
                    Tạo dự án mới
                </Title>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/">
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            className="text-white hover:bg-white/10 border-none"
                        >
                            Quay lại
                        </Button>
                    </Link>

                    <div className="w-[100px]" /> {/* Spacer for centering */}
                </div>
            </motion.header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        className="space-y-6"
                    >
                        {/* Project Info Card */}
                        <motion.div variants={cardVariants}>
                            <Card
                                title={
                                    <div className="flex items-center space-x-2 text-white">
                                        <SoundOutlined />
                                        <span>Thông tin bài hát</span>
                                    </div>
                                }
                                className="bg-white/10 backdrop-blur-lg border-white/20"
                                styles={{
                                    header: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Form.Item
                                        label={<span className="text-white">Tên bài hát</span>}
                                        name="songTitle"
                                        rules={[{ required: true, message: 'Vui lòng nhập tên bài hát' }]}
                                    >
                                        <Input
                                            placeholder="Nhập tên bài hát"
                                            className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="text-white">Nghệ sĩ</span>}
                                        name="artist"
                                        rules={[{ required: true, message: 'Vui lòng nhập tên nghệ sĩ' }]}
                                    >
                                        <Input
                                            placeholder="Nhập tên nghệ sĩ"
                                            className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                                        />
                                    </Form.Item>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Audio Upload Card */}
                        <motion.div variants={cardVariants}>
                            <Card
                                title={
                                    <div className="flex items-center space-x-2 text-white">
                                        <UploadOutlined />
                                        <span>Tải file âm thanh</span>
                                    </div>
                                }
                                className="bg-white/10 backdrop-blur-lg border-white/20"
                                styles={{
                                    header: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <Upload.Dragger
                                    beforeUpload={handleAudioUpload}
                                    showUploadList={false}
                                    accept="audio/*,video/*"
                                    className="bg-white/5 border-white/30 hover:bg-white/10 transition-all duration-300"
                                >
                                    <div className="py-8">
                                        {uploading ? (
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                                                <Text className="text-white">Đang tải file...</Text>
                                            </div>
                                        ) : audioFile ? (
                                            <div className="text-center">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-green-400 text-4xl mb-4"
                                                >
                                                    ✓
                                                </motion.div>
                                                <Title level={4} className="!text-white !mb-2">
                                                    {audioFile.name}
                                                </Title>
                                                <Text className="text-gray-300">
                                                    File đã sẵn sàng để đồng bộ
                                                </Text>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <UploadOutlined className="text-4xl text-purple-400 mb-4" />
                                                <Title level={4} className="!text-white !mb-2">
                                                    Kéo thả file hoặc click để chọn
                                                </Title>
                                                <Text className="text-gray-300">
                                                    Hỗ trợ file MP3, WAV, MP4, WebM và các định dạng âm thanh khác
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </Upload.Dragger>

                                {audioFile && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 space-y-4"
                                    >
                                        {/* File info */}
                                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Text className="text-green-400 font-medium">
                                                        📁 {audioFile.name}
                                                    </Text>
                                                    <br />
                                                    <Text className="text-gray-400 text-sm">
                                                        Kích thước: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                                    </Text>
                                                </div>
                                                <Button
                                                    type="text"
                                                    className="text-red-400 hover:bg-red-400/10"
                                                    onClick={() => {
                                                        setAudioFile(null)
                                                        setAudioDataUrl('')
                                                        setIsPlaying(false)
                                                        setCurrentTime(0)
                                                        setDuration(0)
                                                    }}
                                                >
                                                    Xóa file
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Audio preview player */}
                                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <SoundOutlined className="text-purple-400" />
                                                <Text className="text-purple-400 font-medium">Xem trước âm thanh</Text>
                                            </div>

                                            {/* Hidden audio element */}
                                            <audio
                                                ref={audioRef}
                                                src={audioDataUrl}
                                                onTimeUpdate={handleTimeUpdate}
                                                onLoadedMetadata={handleLoadedMetadata}
                                                onPlay={handlePlay}
                                                onPause={handlePause}
                                                onEnded={handleEnded}
                                                preload="metadata"
                                            />

                                            {/* Controls */}
                                            <div className="space-y-3">
                                                {/* Play/Pause and Seek buttons */}
                                                <div className="flex items-center justify-center space-x-4">
                                                    <Button
                                                        type="text"
                                                        icon={<StepBackwardOutlined />}
                                                        className="text-white hover:bg-white/10 border-none"
                                                        onClick={() => handleSeek(-10)}
                                                    />

                                                    <Button
                                                        type="primary"
                                                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                                        className="bg-gradient-to-r from-purple-500 to-pink-500 border-none w-12 h-12"
                                                        shape="circle"
                                                        onClick={togglePlayPause}
                                                    />

                                                    <Button
                                                        type="text"
                                                        icon={<StepForwardOutlined />}
                                                        className="text-white hover:bg-white/10 border-none"
                                                        onClick={() => handleSeek(10)}
                                                    />
                                                </div>

                                                {/* Progress bar */}
                                                <div className="flex items-center space-x-3">
                                                    <Text className="text-white font-mono text-sm min-w-[40px]">
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

                                                    <Text className="text-white font-mono text-sm min-w-[40px]">
                                                        {formatTime(duration)}
                                                    </Text>
                                                </div>

                                                {/* Volume control */}
                                                <div className="flex items-center justify-center space-x-2">
                                                    <SoundOutlined className="text-white text-sm" />
                                                    <div className="w-24">
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
                                        </div>
                                    </motion.div>
                                )}
                            </Card>
                        </motion.div>

                        {/* Lyrics Input Card */}
                        <motion.div variants={cardVariants}>
                            <Card
                                title={
                                    <div className="flex items-center space-x-2 text-white">
                                        <FileTextOutlined />
                                        <span>Lời bài hát</span>
                                    </div>
                                }
                                className="bg-white/10 backdrop-blur-lg border-white/20"
                                styles={{
                                    header: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <Form.Item
                                    name="lyrics"
                                    rules={[{ required: true, message: 'Vui lòng nhập lời bài hát' }]}
                                >
                                    <TextArea
                                        placeholder="Nhập lời bài hát, mỗi dòng một câu hát..."
                                        rows={12}
                                        className="bg-white/10 border-white/30 text-white placeholder-gray-400 resize-none"
                                    />
                                </Form.Item>

                                {/* Lyrics Grouping Controls */}
                                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <FileTextOutlined className="text-blue-400" />
                                        <Text className="text-blue-400 font-medium">Cách gom nhóm lời bài hát</Text>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-1">
                                                <Select
                                                    value={groupingMode}
                                                    onChange={setGroupingMode}
                                                    className="w-full"
                                                    placeholder="Chọn cách gom nhóm"
                                                    dropdownStyle={{
                                                        backgroundColor: '#1f2937',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                                    }}
                                                >
                                                    <Option value="line">Mỗi dòng là một lời (mặc định)</Option>
                                                    <Option value="paragraph">Gom theo đoạn văn (phân cách bởi dòng trống)</Option>
                                                    <Option value="separator">Gom theo dấu phân cách (--- hoặc ===)</Option>
                                                </Select>
                                            </div>
                                            
                                            <Form.Item shouldUpdate noStyle>
                                                {() => {
                                                    const currentLyrics = form.getFieldValue('lyrics')
                                                    const suggestedMode = currentLyrics ? analyzeAndSuggestGrouping(currentLyrics) : null
                                                    const hasSuggestion = suggestedMode && suggestedMode !== groupingMode
                                                    
                                                    return hasSuggestion ? (
                                                        <Tooltip title={`Hệ thống đề xuất sử dụng chế độ "${
                                                            suggestedMode === 'line' ? 'Mỗi dòng là một lời' :
                                                            suggestedMode === 'paragraph' ? 'Gom theo đoạn văn' :
                                                            'Gom theo dấu phân cách'
                                                        }" dựa trên nội dung đã nhập`}>
                                                            <Button
                                                                size="small"
                                                                type="dashed"
                                                                className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                                                                onClick={() => setGroupingMode(suggestedMode)}
                                                            >
                                                                💡 Áp dụng gợi ý
                                                            </Button>
                                                        </Tooltip>
                                                    ) : null
                                                }}
                                            </Form.Item>
                                        </div>

                                        {/* Auto-suggestion indicator */}
                                        <Form.Item shouldUpdate noStyle>
                                            {() => {
                                                const suggestion = getGroupingSuggestion()
                                                return suggestion ? (
                                                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
                                                        <Text className="text-yellow-400">
                                                            🤖 {suggestion}
                                                        </Text>
                                                    </div>
                                                ) : null
                                            }}
                                        </Form.Item>

                                        <div className="text-gray-400 text-xs space-y-1">
                                            {groupingMode === 'line' && (
                                                <Text className="text-gray-400">
                                                    Mỗi dòng sẽ là một lời riêng biệt để đồng bộ thời gian
                                                </Text>
                                            )}
                                            {groupingMode === 'paragraph' && (
                                                <div className="space-y-1">
                                                    <Text className="text-gray-400">
                                                        Các dòng liên tiếp sẽ được gom thành một lời, phân cách bởi dòng trống
                                                    </Text>
                                                    <Text className="text-gray-400 text-xs">
                                                        Ví dụ: Lời chính + phiên âm hoặc bính âm
                                                    </Text>
                                                </div>
                                            )}
                                            {groupingMode === 'separator' && (
                                                <div className="space-y-1">
                                                    <Text className="text-gray-400">
                                                        Sử dụng dấu "---" hoặc "===" trên dòng riêng để phân tách các lời
                                                    </Text>
                                                    <Text className="text-gray-400 text-xs">
                                                        Phù hợp khi có nhiều thông tin cho mỗi câu hát
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Lyrics Preview */}
                                <Form.Item shouldUpdate>
                                    {() => {
                                        const preview = previewLyrics()
                                        return preview.length > 0 ? (
                                            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <FileTextOutlined className="text-orange-400" />
                                                    <Text className="text-orange-400 font-medium">
                                                        Xem trước: {preview.length} lời bài hát
                                                    </Text>
                                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                                    {preview.slice(0, 5).map((lyric, index) => {
                                                        return (
                                                            <div key={lyric.id} className="p-3 bg-gray-800/50 rounded text-sm">
                                                                <div className="flex items-start space-x-2">
                                                                    <Text className="text-orange-400 font-mono text-xs flex-shrink-0">
                                                                        [{index + 1}]
                                                                    </Text>
                                                                    <div className="flex-1">
                                                                        <div className="text-white font-medium">
                                                                            {lyric.text}
                                                                        </div>
                                                                        {lyric.phonetic && (
                                                                            <div className="text-blue-300 text-xs mt-1">
                                                                                Phiên âm: ({lyric.phonetic})
                                                                            </div>
                                                                        )}
                                                                        {lyric.translation && (
                                                                            <div className="text-green-300 text-xs mt-1">
                                                                                Dịch: [{lyric.translation}]
                                                                            </div>
                                                                        )}
                                                                        {lyric.notes && (
                                                                            <div className="text-yellow-300 text-xs mt-1">
                                                                                Ghi chú: {lyric.notes}
                                                                            </div>
                                                                        )}
                                                                        {lyric.additionalLines && lyric.additionalLines.length > 0 && (
                                                                            <div className="text-gray-400 text-xs mt-1">
                                                                                +{lyric.additionalLines.length} dòng bổ sung
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    {preview.length > 5 && (
                                                        <Text className="text-gray-400 text-xs">
                                                            ... và {preview.length - 5} lời khác
                                                        </Text>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null
                                    }}
                                </Form.Item>

                                {/* Text Formatting Controls */}
                                <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <FormatPainterOutlined className="text-purple-400" />
                                        <Text className="text-purple-400 font-medium">Định dạng văn bản</Text>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <Select
                                                value={textFormat}
                                                onChange={setTextFormat}
                                                className="w-full"
                                                placeholder="Chọn định dạng"
                                                dropdownStyle={{
                                                    backgroundColor: '#1f2937',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                                }}
                                            >
                                                <Option value="original">Giữ nguyên</Option>
                                                <Option value="lowercase">viết thường toàn bộ</Option>
                                                <Option value="uppercase">VIẾT HOA TOÀN BỘ</Option>
                                                <Option value="sentence">Viết hoa đầu câu</Option>
                                                <Option value="title">Viết Hoa Đầu Từ</Option>
                                            </Select>
                                        </div>

                                        <Tooltip title="Áp dụng định dạng cho toàn bộ lời bài hát">
                                            <Button
                                                type="primary"
                                                icon={<FormatPainterOutlined />}
                                                onClick={applyTextFormat}
                                                disabled={textFormat === 'original'}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 border-none"
                                            >
                                                Áp dụng
                                            </Button>
                                        </Tooltip>
                                    </div>

                                    <div className="mt-3 text-gray-400 text-xs">
                                        <Text className="text-gray-400">
                                            Chọn định dạng và bấm "Áp dụng" để format toàn bộ lời bài hát
                                        </Text>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <Title level={5} className="!text-green-400 !mb-2">
                                        💡 Hướng dẫn nhập lyrics đa dòng:
                                    </Title>
                                    <div className="text-gray-300 text-sm space-y-4">
                                        <div>
                                            <Text className="text-green-400 font-medium">Mỗi dòng là một lời (cơ bản):</Text>
                                            <div className="mt-1 p-2 bg-gray-800/50 rounded text-xs font-mono">
                                                Lời đầu tiên<br/>
                                                Lời thứ hai<br/>
                                                Lời thứ ba
                                            </div>
                                        </div>

                                        <div>
                                            <Text className="text-green-400 font-medium">Với phiên âm (trong ngoặc đơn):</Text>
                                            <div className="mt-1 p-2 bg-gray-800/50 rounded text-xs font-mono">
                                                Tôi yêu Việt Nam<br/>
                                                (Toi yeu Viet Nam)<br/>
                                                <br/>
                                                Con đường tôi đi<br/>
                                                (Con duong toi di)
                                            </div>
                                        </div>

                                        <div>
                                            <Text className="text-green-400 font-medium">Với dịch nghĩa (trong ngoặc vuông):</Text>
                                            <div className="mt-1 p-2 bg-gray-800/50 rounded text-xs font-mono">
                                                春天来了<br/>
                                                [Mùa xuân đến rồi]<br/>
                                                <br/>
                                                花开满园<br/>
                                                [Hoa nở khắp vườn]
                                            </div>
                                        </div>

                                        <div>
                                            <Text className="text-green-400 font-medium">Với ghi chú (bắt đầu bằng #, //, Note:):</Text>
                                            <div className="mt-1 p-2 bg-gray-800/50 rounded text-xs font-mono">
                                                Hello world<br/>
                                                // Lời chào thế giới<br/>
                                                <br/>
                                                How are you?<br/>
                                                # Bạn khỏe không?
                                            </div>
                                        </div>

                                        <div>
                                            <Text className="text-green-400 font-medium">Kết hợp đầy đủ:</Text>
                                            <div className="mt-1 p-2 bg-gray-800/50 rounded text-xs font-mono">
                                                Hello beautiful world<br/>
                                                (He-lo biu-ti-ful world)<br/>
                                                [Xin chào thế giới xinh đẹp]<br/>
                                                // Lời chào phổ biến
                                            </div>
                                        </div>

                                        <div>
                                            <Text className="text-green-400 font-medium">Dùng dấu phân cách (--- hoặc ===):</Text>
                                            <div className="mt-1 p-2 bg-gray-800/50 rounded text-xs font-mono">
                                                Câu hát đầu tiên<br/>
                                                (Phiên âm)<br/>
                                                [Dịch nghĩa]<br/>
                                                ---<br/>
                                                Câu hát thứ hai<br/>
                                                (Phiên âm)<br/>
                                                [Dịch nghĩa]
                                            </div>
                                        </div>

                                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                                            <Text className="text-blue-400 font-medium">✨ Tự động phát hiện:</Text>
                                            <ul className="space-y-1 mt-2 text-xs">
                                                <li>• <span className="text-blue-300">Phiên âm:</span> Nội dung trong ngoặc đơn ()</li>
                                                <li>• <span className="text-green-300">Dịch nghĩa:</span> Nội dung trong ngoặc vuông []</li>
                                                <li>• <span className="text-yellow-300">Ghi chú:</span> Dòng bắt đầu bằng #, //, Note:, Ghi chú:</li>
                                                <li>• <span className="text-purple-300">Dấu phân cách:</span> ---, === trên dòng riêng</li>
                                                <li>• <span className="text-orange-300">Tự động gợi ý:</span> Hệ thống sẽ đề xuất cách gom nhóm phù hợp</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div
                            variants={cardVariants}
                            className="flex justify-center"
                        >
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlayCircleOutlined />}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 border-none px-8 py-2 h-auto text-lg"
                                htmlType="submit"
                            >
                                Bắt đầu đồng bộ
                            </Button>
                        </motion.div>
                    </Form>
                </motion.div>
            </div>
        </div>
    )
}

export default AudioLyricsInput
