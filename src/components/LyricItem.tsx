import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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
  formatTime: (time: number | null) => string
}

const lyricItemVariants = {
  inactive: {
    scale: 1,
    opacity: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: { duration: 0.1 }
  },
  active: {
    scale: 1.005,
    opacity: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    transition: {
      duration: 0.15,
      ease: "easeOut" as const
    }
  }
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
  formatTime
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(lyric.text)

  // Update editText when lyric.text changes (but not when user is editing)
  useEffect(() => {
    if (!isEditing) {
      setEditText(lyric.text)
    }
  }, [lyric.text, isEditing])

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

  return (
    <motion.div
      data-index={index}
      variants={lyricItemVariants}
      animate={isActive ? 'active' : 'inactive'}
      className="mb-3 p-4 rounded-lg border border-white/10 cursor-pointer"
      onClick={handleClick}
      layout={false} // Disable layout animations for better performance
      whileHover={isEditing ? {} : { scale: 1.002 }} // Minimal hover effect, disabled when editing
    >
      <Row justify="space-between" align="middle">
        <Col flex="auto">
          <Space direction="vertical" className="w-full">
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
            
            {/* Row 2: Timestamp controls */}
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
    </motion.div>
  )
})

LyricItem.displayName = 'LyricItem'

export default LyricItem
