// Type definitions for Lyrics Synchronizer App

export interface LyricLine {
  text: string
  timestamp: number | null
  endTime: number | null
}

export interface ProjectData {
  songTitle: string
  artist: string
  lyrics: string[] | LyricLine[]
  audioDataUrl: string | null
  audioFileName: string
  audioFileType: string
  isEditing?: boolean
  projectId?: string
  createdAt?: string
  tempAudioId?: string // Reference to temporary audio stored in LocalForage
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
