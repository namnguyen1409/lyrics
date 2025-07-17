import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Input,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Tooltip
} from 'antd'
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  FieldTimeOutlined,
  UndoOutlined
} from '@ant-design/icons'
import type { LyricLine } from '../types'

const { Text } = Typography

interface LyricItemProps {
  lyric: LyricLine
  index: number
  isActive: boolean
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

const LyricItem = React.memo<LyricItemProps>(({
  lyric,
  index,
  isActive,
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
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(lyric.text)
  const [isEditingPhonetic, setIsEditingPhonetic] = useState(false)
  const [editPhonetic, setEditPhonetic] = useState(lyric.phonetic || '')
  const [isEditingTranslation, setIsEditingTranslation] = useState(false)
  const [editTranslation, setEditTranslation] = useState(lyric.translation || '')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editNotes, setEditNotes] = useState(lyric.notes || '')

  // Update edit states when lyric changes (but not when user is editing)
  useEffect(() => {
    if (!isEditing) {
      setEditText(lyric.text)
    }
    if (!isEditingPhonetic) {
      setEditPhonetic(lyric.phonetic || '')
    }
    if (!isEditingTranslation) {
      setEditTranslation(lyric.translation || '')
    }
    if (!isEditingNotes) {
      setEditNotes(lyric.notes || '')
    }
  }, [lyric, isEditing, isEditingPhonetic, isEditingTranslation, isEditingNotes])

  const handleClick = useCallback(() => {
    if (!isEditing) {
      onLyricClick(index)
    }
  }, [onLyricClick, index, isEditing])

  const handleSetTimestamp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSetTimestamp(index)
  }, [onSetTimestamp, index])

  const handleSetEndTime = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSetEndTime(index)
  }, [onSetEndTime, index])

  const handleClearTimestamp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClearTimestamp(index)
  }, [onClearTimestamp, index])

  const handleAddLineAbove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onAddLineAbove(index)
  }, [onAddLineAbove, index])

  const handleAddLineBelow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onAddLineBelow(index)
  }, [onAddLineBelow, index])

  const handleDeleteLine = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteLine(index)
  }, [onDeleteLine, index])

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditText(lyric.text)
  }, [lyric.text])

  const handleSaveEdit = useCallback(() => {
    onUpdateText(index, editText.trim())
    setIsEditing(false)
  }, [onUpdateText, index, editText])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditText(lyric.text)
  }, [lyric.text])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation() // Prevent global shortcuts when editing
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }, [handleSaveEdit, handleCancelEdit])

  const handleInputBlur = useCallback(() => {
    // Small delay to allow click on save button
    setTimeout(() => {
      if (isEditing) {
        handleSaveEdit()
      }
    }, 100)
  }, [isEditing, handleSaveEdit])

  // Phonetic editing handlers
  const handleStartEditPhonetic = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingPhonetic(true)
    setEditPhonetic(lyric.phonetic || '')
  }, [lyric.phonetic])

  const handleSavePhonetic = useCallback(() => {
    onUpdatePhonetic(index, editPhonetic.trim())
    setIsEditingPhonetic(false)
  }, [onUpdatePhonetic, index, editPhonetic])

  const handleCancelPhonetic = useCallback(() => {
    setIsEditingPhonetic(false)
    setEditPhonetic(lyric.phonetic || '')
  }, [lyric.phonetic])

  // Translation editing handlers
  const handleStartEditTranslation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingTranslation(true)
    setEditTranslation(lyric.translation || '')
  }, [lyric.translation])

  const handleSaveTranslation = useCallback(() => {
    onUpdateTranslation(index, editTranslation.trim())
    setIsEditingTranslation(false)
  }, [onUpdateTranslation, index, editTranslation])

  const handleCancelTranslation = useCallback(() => {
    setIsEditingTranslation(false)
    setEditTranslation(lyric.translation || '')
  }, [lyric.translation])

  // Notes editing handlers
  const handleStartEditNotes = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingNotes(true)
    setEditNotes(lyric.notes || '')
  }, [lyric.notes])

  const handleSaveNotes = useCallback(() => {
    onUpdateNotes(index, editNotes.trim())
    setIsEditingNotes(false)
  }, [onUpdateNotes, index, editNotes])

  const handleCancelNotes = useCallback(() => {
    setIsEditingNotes(false)
    setEditNotes(lyric.notes || '')
  }, [lyric.notes])

  return (
    <div
      data-index={index}
      className={`mb-3 p-4 rounded-lg border border-white/10 cursor-pointer min-h-[70px] transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50 shadow-lg'
          : 'bg-white/5 hover:bg-white/10 hover:border-white/20'
      }`}
      style={{ 
        contain: 'layout style', // CSS containment to prevent layout shifts
        minHeight: '70px' // Ensure consistent minimum height
      }}
      onClick={handleClick}
    >
      <Row justify="space-between" align="middle">
        <Col flex="auto">
          <Space direction="vertical" className="w-full" size="small">
            {/* Main lyrics text */}
            {isEditing ? (
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleInputBlur}
                autoFocus
                className="text-base font-medium"
                placeholder="Nhập lời bài hát..."
              />
            ) : (
              <Text className="text-white text-base font-medium">
                {lyric.text || <span className="text-gray-400 italic">Dòng trống</span>}
              </Text>
            )}

            {/* Phonetic text */}
            {(lyric.phonetic || isEditingPhonetic) && (
              <div className="ml-4">
                {isEditingPhonetic ? (
                  <Space>
                    <Input
                      value={editPhonetic}
                      onChange={(e) => setEditPhonetic(e.target.value)}
                      className="text-sm"
                      placeholder="Phiên âm..."
                      size="small"
                    />
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleSavePhonetic} />
                    <Button size="small" icon={<CloseOutlined />} onClick={handleCancelPhonetic} />
                  </Space>
                ) : (
                  <Text className="text-blue-300 text-sm italic" onClick={handleStartEditPhonetic}>
                    📢 {lyric.phonetic}
                  </Text>
                )}
              </div>
            )}

            {/* Translation */}
            {(lyric.translation || isEditingTranslation) && (
              <div className="ml-4">
                {isEditingTranslation ? (
                  <Space>
                    <Input
                      value={editTranslation}
                      onChange={(e) => setEditTranslation(e.target.value)}
                      className="text-sm"
                      placeholder="Bản dịch..."
                      size="small"
                    />
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleSaveTranslation} />
                    <Button size="small" icon={<CloseOutlined />} onClick={handleCancelTranslation} />
                  </Space>
                ) : (
                  <Text className="text-green-300 text-sm" onClick={handleStartEditTranslation}>
                    🌐 {lyric.translation}
                  </Text>
                )}
              </div>
            )}

            {/* Notes */}
            {(lyric.notes || isEditingNotes) && (
              <div className="ml-4">
                {isEditingNotes ? (
                  <Space>
                    <Input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="text-sm"
                      placeholder="Ghi chú..."
                      size="small"
                    />
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleSaveNotes} />
                    <Button size="small" icon={<CloseOutlined />} onClick={handleCancelNotes} />
                  </Space>
                ) : (
                  <Text className="text-yellow-300 text-sm" onClick={handleStartEditNotes}>
                    📝 {lyric.notes}
                  </Text>
                )}
              </div>
            )}

            {/* Timestamp info */}
            <Space>
              <Tag color={lyric.timestamp !== null ? 'green' : 'default'}>
                Start: {formatTime(lyric.timestamp)}
              </Tag>
              <Tag color={lyric.endTime !== null ? 'orange' : 'default'}>
                End: {formatTime(lyric.endTime)}
              </Tag>
            </Space>
          </Space>
        </Col>
        <Col>
          <Space direction="vertical" size="small">
            {/* Row 1: Lyrics management */}
            <Space size="small">
              <Tooltip title="Thêm dòng phía trên">
                <Button
                  size="small"
                  icon={<PlusCircleOutlined />}
                  onClick={handleAddLineAbove}
                  className="text-green-400 hover:text-green-300"
                />
              </Tooltip>
              <Tooltip title="Thêm dòng phía dưới">
                <Button
                  size="small"
                  icon={<PlusCircleOutlined />}
                  onClick={handleAddLineBelow}
                  className="text-blue-400 hover:text-blue-300"
                />
              </Tooltip>
              {isEditing ? (
                <>
                  <Tooltip title="Lưu chỉnh sửa">
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={handleSaveEdit}
                    />
                  </Tooltip>
                  <Tooltip title="Hủy chỉnh sửa">
                    <Button
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={handleCancelEdit}
                    />
                  </Tooltip>
                </>
              ) : (
                <Tooltip title="Chỉnh sửa nội dung">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={handleStartEdit}
                    className="text-yellow-400 hover:text-yellow-300"
                  />
                </Tooltip>
              )}
              <Tooltip title="Xóa dòng này">
                <Button
                  size="small"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={handleDeleteLine}
                  className="text-red-400 hover:text-red-300"
                  disabled={index === 0} // Không cho xóa dòng đầu tiên
                />
              </Tooltip>
            </Space>
            
            {/* Row 2: Additional fields */}
            <Space size="small">
              <Tooltip title={lyric.phonetic ? "Chỉnh sửa phiên âm" : "Thêm phiên âm"}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={handleStartEditPhonetic}
                  className={lyric.phonetic ? "text-blue-400 hover:text-blue-300" : "text-gray-400 hover:text-blue-300"}
                >
                  📢
                </Button>
              </Tooltip>
              <Tooltip title={lyric.translation ? "Chỉnh sửa bản dịch" : "Thêm bản dịch"}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={handleStartEditTranslation}
                  className={lyric.translation ? "text-green-400 hover:text-green-300" : "text-gray-400 hover:text-green-300"}
                >
                  🌐
                </Button>
              </Tooltip>
              <Tooltip title={lyric.notes ? "Chỉnh sửa ghi chú" : "Thêm ghi chú"}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={handleStartEditNotes}
                  className={lyric.notes ? "text-yellow-400 hover:text-yellow-300" : "text-gray-400 hover:text-yellow-300"}
                >
                  📝
                </Button>
              </Tooltip>
            </Space>
            
            {/* Row 3: Timestamp controls */}
            <Space size="small">
              <Tooltip title="Đặt timestamp hiện tại">
                <Button
                  type="primary"
                  size="small"
                  icon={<FieldTimeOutlined />}
                  onClick={handleSetTimestamp}
                />
              </Tooltip>
              <Tooltip title="Đặt thời gian kết thúc">
                <Button
                  size="small"
                  icon={<FieldTimeOutlined />}
                  onClick={handleSetEndTime}
                />
              </Tooltip>
              {lyric.timestamp !== null && index !== 0 && (
                <Tooltip title="Xóa timestamp">
                  <Button
                    danger
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={handleClearTimestamp}
                  />
                </Tooltip>
              )}
            </Space>
          </Space>
        </Col>
      </Row>
    </div>
  )
})

LyricItem.displayName = 'LyricItem'

export default LyricItem
