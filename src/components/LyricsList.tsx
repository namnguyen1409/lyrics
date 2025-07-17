import React from 'react'
import { Card, Typography } from 'antd'
import LyricItem from './LyricItem'
import type { LyricLine } from '../types'

const { Text } = Typography

interface LyricsListProps {
  syncedLyrics: LyricLine[]
  currentLyricIndex: number
  lyricsListRef: React.RefObject<HTMLDivElement>
  onLyricClick: (index: number) => void
  onSetTimestamp: (index: number) => void
  onSetEndTime: (index: number) => void
  onClearTimestamp: (index: number) => void
  onAddLineAbove: (index: number) => void
  onAddLineBelow: (index: number) => void
  onDeleteLine: (index: number) => void
  onUpdateText: (index: number, text: string) => void
  onUpdatePhonetic: (index: number, phonetic: string) => void
  onUpdateTranslation: (index: number, translation: string) => void
  onUpdateNotes: (index: number, notes: string) => void
  formatTime: (time: number | null) => string
}

const LyricsList: React.FC<LyricsListProps> = ({
  syncedLyrics,
  currentLyricIndex,
  lyricsListRef,
  onLyricClick,
  onSetTimestamp,
  onSetEndTime,
  onClearTimestamp,
  onAddLineAbove,
  onAddLineBelow,
  onDeleteLine,
  onUpdateText,
  onUpdatePhonetic,
  onUpdateTranslation,
  onUpdateNotes,
  formatTime
}) => {
  return (
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
            onLyricClick={onLyricClick}
            onSetTimestamp={onSetTimestamp}
            onSetEndTime={onSetEndTime}
            onClearTimestamp={onClearTimestamp}
            onAddLineAbove={onAddLineAbove}
            onAddLineBelow={onAddLineBelow}
            onDeleteLine={onDeleteLine}
            onUpdateText={onUpdateText}
            onUpdatePhonetic={onUpdatePhonetic}
            onUpdateTranslation={onUpdateTranslation}
            onUpdateNotes={onUpdateNotes}
            formatTime={formatTime}
          />
        ))}
      </div>
    </Card>
  )
}

export default LyricsList
