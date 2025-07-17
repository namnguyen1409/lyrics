// Type definitions for Lyrics Synchronizer App

export interface LyricLine {
  id: string
  text: string
  timestamp: number | null
  endTime: number | null
  isActive?: boolean
  // Thông tin bổ sung cho mỗi dòng lời
  phonetic?: string     // Phiên âm
  translation?: string  // Dịch nghĩa
  notes?: string        // Ghi chú
  // Hoặc có thể sử dụng cấu trúc linh hoạt hơn
  additionalLines?: {
    type: 'phonetic' | 'translation' | 'note' | 'custom'
    text: string
    label?: string
  }[]
}

export interface ProjectData {
  id?: string
  songTitle: string
  artist: string
  lyrics: LyricLine[]
  audioFile?: File
  audioDataUrl: string | null
  audioFileName: string
  audioFileType: string
  isEditing?: boolean
  projectId?: string
  createdAt?: string
  updatedAt?: string
  tempAudioId?: string // Reference to temporary audio stored in LocalForage
  // Cấu hình gom nhóm lyrics
  groupingMode?: 'line' | 'paragraph' | 'separator'
  // Metadata cho việc phân tích và gợi ý
  analysisMetadata?: {
    totalLines: number
    detectedPatterns: string[]
    suggestedGrouping: 'line' | 'paragraph' | 'separator'
  }
}

export interface SavedProject {
  id: string
  title: string
  artist: string
  lyrics: LyricLine[]
  createdAt: string
  updatedAt?: string
  audioFileName: string
  audioDataUrl: string | null
  audioFileType: string
}

export interface OfflineStatus {
  isOnline: boolean
  canWorkOffline: boolean
  isInstalled: boolean
  hasPendingOperations: boolean
  swSupported: boolean
  features: {
    serviceWorker: boolean
    indexedDB: boolean
    caches: boolean
    storageManager: boolean
    persistentStorage: boolean
  }
}

export interface StorageUsage {
  used: number
  available: number
  usedMB: string
  availableMB: string
  isPersistent: boolean
  usageDetails: Record<string, number>
}

export interface PendingOperation {
  type: 'SAVE_PROJECT' | 'SYNC_DATA'
  data: any
  timestamp: number
}

export type TextFormat = 'original' | 'lowercase' | 'uppercase' | 'sentence' | 'title'

// Interfaces cho việc xử lý lyrics với nhiều dòng
export interface LyricsGroupingOptions {
  mode: 'line' | 'paragraph' | 'separator'
  includePhonetic: boolean
  includeTranslation: boolean
  includeNotes: boolean
  customSeparator?: string
}

export interface LyricsAnalysis {
  totalLines: number
  emptyLines: number
  paragraphs: number
  separators: number
  avgLinesPerParagraph: number
  detectedPatterns: {
    hasPhoneticPattern: boolean
    hasBracketsPattern: boolean
    hasNumberedLines: boolean
    hasChineseCharacters: boolean
    hasVietnameseMarks: boolean
  }
  patternDetails: string[]
  suggestedMode: 'line' | 'paragraph' | 'separator'
  confidence: number // 0-1, độ tin cậy của gợi ý
}

export interface ProcessedLyric {
  id: string
  mainText: string
  phonetic?: string
  translation?: string
  notes?: string
  rawLines: string[]
  groupIndex: number
}

// Interface cho việc import/export lyrics với nhiều định dạng
export interface LyricsImportResult {
  lyrics: LyricLine[]
  metadata: {
    format: 'plain' | 'lrc' | 'srt' | 'vtt' | 'custom'
    groupingMode: 'line' | 'paragraph' | 'separator'
    hasTimestamps: boolean
    analysis: LyricsAnalysis
  }
}

// Cấu hình hiển thị fields cho lyrics
export interface LyricDisplayConfig {
  showPhonetic: boolean
  showTranslation: boolean
  showNotes: boolean
  showAdditionalLines: boolean
}

// Cấu hình hiệu ứng nhấn mạnh
export type EmphasisMode = 'character' | 'word' | 'line'

export interface EmphasisEffect {
  mode: EmphasisMode
  style: {
    color?: string
    backgroundColor?: string
    scale?: number
    glow?: boolean
    glowColor?: string
    glowIntensity?: number
    animation?: 'none' | 'pulse' | 'bounce' | 'fade' | 'slide'
    animationDuration?: number
    fontSize?: string
    fontWeight?: string
    textShadow?: string
  }
}

export interface KaraokeSettings {
  displayConfig: LyricDisplayConfig
  emphasisEffect: EmphasisEffect
  // Cấu hình timing
  timingConfig?: {
    previewMode: boolean
    smoothTransition: boolean
    transitionDuration: number
  }
}
