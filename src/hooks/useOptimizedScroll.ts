import { useCallback, useRef } from 'react'

export const useOptimizedScroll = () => {
  const throttledScrollRef = useRef<NodeJS.Timeout | null>(null)

  // Optimized scroll function with better performance
  const scrollToHighlightedLine = useCallback((
    lyricsListRef: React.RefObject<HTMLDivElement>,
    index: number
  ): void => {
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
  const throttledScrollToLine = useCallback((
    lyricsListRef: React.RefObject<HTMLDivElement>,
    index: number
  ) => {
    if (throttledScrollRef.current) {
      clearTimeout(throttledScrollRef.current)
    }

    throttledScrollRef.current = setTimeout(() => {
      scrollToHighlightedLine(lyricsListRef, index)
    }, 150) // Increased timeout to reduce scroll frequency
  }, [scrollToHighlightedLine])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (throttledScrollRef.current) {
      clearTimeout(throttledScrollRef.current)
    }
  }, [])

  return {
    scrollToHighlightedLine,
    throttledScrollToLine,
    cleanup
  }
}
