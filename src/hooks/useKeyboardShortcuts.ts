import { useCallback } from 'react'

export const useKeyboardShortcuts = (
  togglePlayPause: () => void,
  goToPreviousLine: () => void,
  goToNextLine: () => void,
  seekBackward: () => void,
  seekForward: () => void,
  setEndTime: (index: number) => void,
  setTimestamp: (index: number) => void,
  addLineAbove: (index: number) => void,
  addLineBelow: (index: number) => void,
  deleteLine: (index: number) => void,
  currentLyricIndex: number,
  setShowShortcuts: (show: boolean) => void
) => {
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
  }, [
    togglePlayPause,
    goToPreviousLine, 
    goToNextLine,
    seekBackward,
    seekForward,
    setEndTime,
    setTimestamp,
    addLineAbove,
    addLineBelow,
    deleteLine,
    currentLyricIndex,
    setShowShortcuts
  ])

  return { handleKeyDown }
}
