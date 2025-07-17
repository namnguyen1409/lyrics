import React from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  Button,
  Slider,
  Typography,
  Space,
  Row,
  Col,
  Progress,
  Select
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  FieldTimeOutlined,
  FastBackwardOutlined,
  FastForwardOutlined
} from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

interface AudioControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackSpeed: number
  progressPercentage: number
  syncedCount: number
  totalLyrics: number
  currentLyricIndex: number
  onTogglePlayPause: () => void
  onSeekBackward: () => void
  onSeekForward: () => void
  onGoToPreviousLine: () => void
  onGoToNextLine: () => void
  onSetTimestamp: () => void
  onSetEndTime: () => void
  onProgressChange: (value: number) => void
  onPlaybackSpeedChange: (speed: number) => void
  formatDisplayTime: (time: number) => string
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  playbackSpeed,
  progressPercentage,
  syncedCount,
  totalLyrics,
  currentLyricIndex,
  onTogglePlayPause,
  onSeekBackward,
  onSeekForward,
  onGoToPreviousLine,
  onGoToNextLine,
  onSetTimestamp,
  onSetEndTime,
  onProgressChange,
  onPlaybackSpeedChange,
  formatDisplayTime
}) => {
  return (
    <Card
      className="bg-white/10 backdrop-blur-lg border-white/20 sticky h-fit w-full"
      title={<Text className="text-white font-semibold">Điều khiển âm thanh</Text>}
    >
      <Space direction="vertical" className="w-full" size="large">
        {/* Play/Pause Button */}
        <motion.div
          className="text-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={onTogglePlayPause}
            className="!w-16 !h-16 !text-2xl"
          />
        </motion.div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <Text className="text-white">{formatDisplayTime(currentTime)}</Text>
            <Text className="text-white">{formatDisplayTime(duration)}</Text>
          </div>
          <Slider
            value={progressPercentage}
            onChange={onProgressChange}
            className="!mb-0"
            tooltip={{
              formatter: (value) => value !== undefined ? formatDisplayTime((value / 100) * duration) : '?'
            }}
          />
        </div>

        {/* Speed Control */}
        <div>
          <Text className="text-white block mb-2">Tốc độ phát:</Text>
          <Select
            value={playbackSpeed}
            onChange={onPlaybackSpeedChange}
            className="w-full"
            size="large"
          >
            <Option value={0.5}>0.5x</Option>
            <Option value={0.75}>0.75x</Option>
            <Option value={1}>1x</Option>
            <Option value={1.25}>1.25x</Option>
            <Option value={1.5}>1.5x</Option>
            <Option value={2}>2x</Option>
          </Select>
        </div>

        {/* Control Buttons */}
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Button
              block
              icon={<FastBackwardOutlined />}
              onClick={onSeekBackward}
            >
              -5s
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              icon={<FastForwardOutlined />}
              onClick={onSeekForward}
            >
              +5s
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              icon={<CaretUpOutlined />}
              onClick={onGoToPreviousLine}
              disabled={currentLyricIndex === 0}
            >
              Dòng trước
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              icon={<CaretDownOutlined />}
              onClick={onGoToNextLine}
              disabled={currentLyricIndex === totalLyrics - 1}
            >
              Dòng tiếp
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              type="primary"
              icon={<FieldTimeOutlined />}
              onClick={onSetTimestamp}
            >
              Set Time
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              icon={<FieldTimeOutlined />}
              onClick={onSetEndTime}
            >
              Set End
            </Button>
          </Col>
        </Row>

        {/* Progress Info */}
        <div className="text-center">
          <Progress
            percent={(syncedCount / totalLyrics) * 100}
            format={() => `${syncedCount}/${totalLyrics}`}
            strokeColor={{
              '0%': '#6366f1',
              '100%': '#8b5cf6',
            }}
          />
          <Text className="text-gray-300 text-sm">Tiến độ đồng bộ</Text>
        </div>
      </Space>
    </Card>
  )
}

export default AudioControls
