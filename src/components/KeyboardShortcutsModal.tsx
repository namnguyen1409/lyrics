import React from 'react'
import { Modal, Typography, Tag } from 'antd'

const { Title } = Typography

interface KeyboardShortcutsModalProps {
  open: boolean
  onCancel: () => void
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  open,
  onCancel
}) => {
  return (
    <Modal
      title="Phím tắt"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div className="space-y-4">
        <div>
          <Title level={5}>Điều khiển phát nhạc</Title>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Phát/Tạm dừng</span>
              <Tag>Space</Tag>
            </div>
            <div className="flex justify-between">
              <span>Tua lùi 5 giây</span>
              <Tag>←</Tag>
            </div>
            <div className="flex justify-between">
              <span>Tua tới 5 giây</span>
              <Tag>→</Tag>
            </div>
          </div>
        </div>

        <div>
          <Title level={5}>Điều khiển lyrics</Title>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Dòng trước</span>
              <Tag>↑</Tag>
            </div>
            <div className="flex justify-between">
              <span>Dòng sau</span>
              <Tag>↓</Tag>
            </div>
            <div className="flex justify-between">
              <span>Đặt timestamp</span>
              <Tag>S</Tag>
            </div>
            <div className="flex justify-between">
              <span>Đặt thời gian kết thúc</span>
              <Tag>E</Tag>
            </div>
          </div>
        </div>

        <div>
          <Title level={5}>Quản lý lyrics</Title>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Thêm dòng phía trên</span>
              <Tag>Shift + Enter</Tag>
            </div>
            <div className="flex justify-between">
              <span>Thêm dòng phía dưới</span>
              <Tag>Ctrl + Enter</Tag>
            </div>
            <div className="flex justify-between">
              <span>Xóa dòng hiện tại</span>
              <Tag>Ctrl + Delete</Tag>
            </div>
            <div className="flex justify-between">
              <span>Hiển thị phím tắt</span>
              <Tag>F1</Tag>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default KeyboardShortcutsModal
