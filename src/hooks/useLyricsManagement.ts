import { useCallback, useMemo } from 'react'
import type { LyricLine } from '../types'

export const useLyricsManagement = (
  syncedLyrics: LyricLine[],
  setSyncedLyrics: React.Dispatch<React.SetStateAction<LyricLine[]>>,
  currentLyricIndex: number,
  setCurrentLyricIndex: React.Dispatch<React.SetStateAction<number>>,
  currentTime: number
) => {
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

  // Lyrics management functions
  const addLineAbove = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics.splice(index, 0, {
        text: '',
        timestamp: null,
        endTime: null
      })
      return newLyrics
    })
    // Update current index if needed
    if (index <= currentLyricIndex) {
      setCurrentLyricIndex(currentLyricIndex + 1)
    }
  }, [currentLyricIndex, setSyncedLyrics, setCurrentLyricIndex])

  const addLineBelow = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics.splice(index + 1, 0, {
        text: '',
        timestamp: null,
        endTime: null
      })
      return newLyrics
    })
    // Update current index if needed
    if (index < currentLyricIndex) {
      setCurrentLyricIndex(currentLyricIndex + 1)
    }
  }, [currentLyricIndex, setSyncedLyrics, setCurrentLyricIndex])

  const deleteLine = useCallback((index: number) => {
    if (syncedLyrics.length <= 1) {
      return false // Cannot delete last line
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
    
    return true
  }, [syncedLyrics.length, currentLyricIndex, setSyncedLyrics, setCurrentLyricIndex])

  const updateLyricText = useCallback((index: number, newText: string) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = {
        ...newLyrics[index],
        text: newText
      }
      return newLyrics
    })
  }, [setSyncedLyrics])

  const setTimestamp = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = { ...newLyrics[index], timestamp: currentTime }
      return newLyrics
    })
  }, [currentTime, setSyncedLyrics])

  const setEndTime = useCallback((index: number) => {
    setSyncedLyrics(prev => {
      const newLyrics = [...prev]
      newLyrics[index] = { ...newLyrics[index], endTime: currentTime }
      return newLyrics
    })
  }, [currentTime, setSyncedLyrics])

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
  }, [setSyncedLyrics])

  // Memoize expensive calculations
  const syncedCount = useMemo(() => {
    return syncedLyrics.filter(l => l.timestamp !== null).length
  }, [syncedLyrics])

  return {
    findActiveIndex,
    addLineAbove,
    addLineBelow,
    deleteLine,
    updateLyricText,
    setTimestamp,
    setEndTime,
    clearTimestamp,
    syncedCount
  }
}
