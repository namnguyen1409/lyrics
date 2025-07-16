import React, { useState, useEffect } from 'react'
import { Button, Card, Typography, Space, Tag, Modal, Progress, Alert } from 'antd'
import { 
  DownloadOutlined, 
  WifiOutlined, 
  CloudOutlined, 
  MobileOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreAddOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import offlineManager, { 
  isOnline, 
  canWorkOffline, 
  getStorageUsage, 
  installApp, 
  isInstalled, 
  requestPersistentStorage
} from '../utils/offlineManager'
import type { StorageUsage } from '../types'

const { Title, Text } = Typography

const OfflineStatus: React.FC = () => {
  const [online, setOnline] = useState<boolean>(isOnline())
  const [storage, setStorage] = useState<StorageUsage | null>(null)
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false)
  const [installing, setInstalling] = useState<boolean>(false)

  useEffect(() => {
    const handleOnline = (): void => {
      setOnline(true)
    }
    const handleOffline = (): void => {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load initial data
    loadStorageInfo()

    // Update storage info periodically
    const interval = setInterval(loadStorageInfo, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const loadStorageInfo = async (): Promise<void> => {
    try {
      const info = await getStorageUsage()
      setStorage(info)
    } catch (error) {
      console.error('Failed to get storage info:', error)
    }
  }

  const handleInstallApp = async (): Promise<void> => {
    setInstalling(true)
    try {
      const success = await installApp()
      if (success) {
        setShowInstallModal(false)
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setInstalling(false)
    }
  }

  const handleRequestPersistentStorage = async (): Promise<void> => {
    try {
      const granted = await requestPersistentStorage()
      if (granted) {
        await loadStorageInfo()
      }
    } catch (error) {
      console.error('Failed to request persistent storage:', error)
    }
  }

  const getStoragePercentage = (): number => {
    if (!storage || !storage.available) return 0
    return (storage.used / storage.available) * 100
  }

  return (
    <>
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <div className="space-y-4">
          {/* Online/Offline Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {online ? (
                <WifiOutlined className="text-green-400 text-lg" />
              ) : (
                <CloudOutlined className="text-orange-400 text-lg" />
              )}
              <Text className="text-white font-medium">
                Trạng thái kết nối
              </Text>
            </div>
            <Tag color={online ? 'green' : 'orange'}>
              {online ? 'Trực tuyến' : 'Ngoại tuyến'}
            </Tag>
          </div>

          {/* Offline Capability Status */}
          {!online && (
            <Alert
              message="Hoạt động offline"
              description={
                canWorkOffline() 
                  ? "Ứng dụng có thể hoạt động hoàn toàn offline. Tất cả tính năng đều khả dụng!"
                  : "Một số tính năng có thể bị hạn chế khi offline."
              }
              type={canWorkOffline() ? "success" : "warning"}
              icon={canWorkOffline() ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              showIcon
            />
          )}

          {/* Offline Features List */}
          {!online && canWorkOffline() && (
            <div className="bg-white/5 rounded-lg p-3">
              <Text className="text-white font-medium block mb-2">
                ✅ Tính năng hoạt động offline:
              </Text>
              <div className="text-gray-300 text-sm space-y-1">
                <div>• Tải lên và phát audio/video</div>
                <div>• Nhập và chỉnh sửa lyrics</div>
                <div>• Đồng bộ timestamps</div>
                <div>• Xem trước karaoke</div>
                <div>• Lưu và quản lý dự án</div>
                <div>• Xuất file synchronized</div>
              </div>
            </div>
          )}

          {/* Offline Capability */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MobileOutlined className="text-blue-400 text-lg" />
              <Text className="text-white font-medium">
                Hỗ trợ offline
              </Text>
            </div>
            <Tag color={canWorkOffline() ? 'blue' : 'default'}>
              {canWorkOffline() ? 'Đầy đủ' : 'Hạn chế'}
            </Tag>
          </div>

          {/* Storage Usage */}
          {storage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text className="text-white font-medium">
                  Bộ nhớ đã sử dụng
                </Text>
                <div className="text-right">
                  <Text className="text-gray-300 text-sm block">
                    {storage.usedMB} MB / {storage.availableMB} MB
                  </Text>
                  <Tag 
                    color={storage.isPersistent ? 'green' : 'orange'}
                  >
                    {storage.isPersistent ? 'Vĩnh viễn' : 'Tạm thời'}
                  </Tag>
                </div>
              </div>
              <Progress
                percent={getStoragePercentage()}
                showInfo={false}
                strokeColor={{
                  '0%': '#6366f1',
                  '100%': '#8b5cf6',
                }}
                trailColor="rgba(255,255,255,0.1)"
              />
              {!storage.isPersistent && (
                <Text className="text-orange-400 text-xs block">
                  ⚠️ Dữ liệu có thể bị xóa khi thiếu dung lượng
                </Text>
              )}
            </div>
          )}

          {/* Install App Button */}
          {!isInstalled() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                onClick={() => setShowInstallModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 border-none"
              >
                Cài đặt ứng dụng
              </Button>
            </motion.div>
          )}

          {/* PWA Installation Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AppstoreAddOutlined className="text-purple-400 text-lg" />
              <Text className="text-white font-medium">
                Cài đặt ứng dụng
              </Text>
            </div>
            <div className="flex items-center space-x-2">
              {isInstalled() ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Đã cài đặt
                </Tag>
              ) : (
                <>
                  <Tag color="orange" icon={<InfoCircleOutlined />}>
                    Chưa cài đặt
                  </Tag>
                  {offlineManager.getInstallPrompt() ? (
                    <Button 
                      type="primary" 
                      icon={<AppstoreAddOutlined />}
                      size="small"
                      onClick={() => setShowInstallModal(true)}
                    >
                      Cài đặt
                    </Button>
                  ) : (
                    <Button 
                      type="default" 
                      icon={<InfoCircleOutlined />}
                      size="small"
                      onClick={() => setShowInstallModal(true)}
                    >
                      Hướng dẫn
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Storage Settings */}
          <Button
            type={storage?.isPersistent ? "default" : "primary"}
            icon={<SettingOutlined />}
            size="small"
            onClick={handleRequestPersistentStorage}
            className={storage?.isPersistent ? "text-gray-300 hover:text-white" : ""}
            disabled={storage?.isPersistent}
          >
            {storage?.isPersistent ? 'Lưu trữ vĩnh viễn đã kích hoạt' : 'Yêu cầu lưu trữ vĩnh viễn'}
          </Button>
        </div>
      </Card>

      {/* Install App Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <AppstoreAddOutlined className="text-purple-400" />
            <span>Cài đặt ứng dụng</span>
          </div>
        }
        open={showInstallModal}
        onCancel={() => setShowInstallModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowInstallModal(false)}>
            Đóng
          </Button>,
          !isInstalled() && offlineManager.getInstallPrompt() && (
            <Button
              key="install"
              type="primary"
              icon={<AppstoreAddOutlined />}
              loading={installing}
              onClick={handleInstallApp}
            >
              Cài đặt ngay
            </Button>
          )
        ].filter(Boolean)}
        styles={{
          mask: {
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          },
          content: {
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px'
          },
          header: {
            background: 'rgba(30, 41, 59, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          },
          body: {
            background: 'transparent',
            color: 'white'
          },
          footer: {
            background: 'rgba(30, 41, 59, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Space direction="vertical" className="w-full">
          {isInstalled() ? (
            <Alert
              message="Ứng dụng đã được cài đặt!"
              description="Bạn có thể sử dụng ứng dụng hoàn toàn offline."
              type="success"
              showIcon
            />
          ) : offlineManager.getInstallPrompt() ? (
            <>
              <Text className="text-gray-300">
                Ứng dụng có thể được cài đặt! Nhấn nút bên dưới để cài đặt.
              </Text>
              
              <div className="bg-white/5 rounded-lg p-3">
                <Title level={5} className="!text-white !mb-2">
                  Lợi ích khi cài đặt:
                </Title>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>✓ Hoạt động hoàn toàn offline</div>
                  <div>✓ Khởi động nhanh hơn</div>
                  <div>✓ Giao diện native trên thiết bị</div>
                  <div>✓ Không cần browser</div>
                  <div>✓ Tự động kích hoạt lưu trữ vĩnh viễn</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Text className="text-gray-300">
                Để cài đặt ứng dụng, hãy làm theo hướng dẫn cho trình duyệt của bạn:
              </Text>
              
              <div className="bg-white/5 rounded-lg p-3">
                <Title level={5} className="!text-white !mb-2">
                  🌐 Chrome / Edge:
                </Title>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>1. Tìm biểu tượng "cài đặt" (⊕) trên thanh địa chỉ</div>
                  <div>2. Hoặc Menu → Cài đặt ứng dụng này</div>
                  <div>3. Nhấn "Cài đặt" để xác nhận</div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <Title level={5} className="!text-white !mb-2">
                  🦊 Firefox:
                </Title>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>1. Tìm biểu tượng "home" trong thanh địa chỉ</div>
                  <div>2. Chọn "Cài đặt"</div>
                  <div>3. Hoặc thêm vào Home Screen</div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <Title level={5} className="!text-white !mb-2">
                  🍎 Safari:
                </Title>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>1. Nhấn nút "Chia sẻ" (□↗)</div>
                  <div>2. Chọn "Thêm vào Home Screen"</div>
                  <div>3. Xác nhận để cài đặt</div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <Title level={5} className="!text-white !mb-2">
                  Lợi ích khi cài đặt:
                </Title>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>✓ Hoạt động hoàn toàn offline</div>
                  <div>✓ Khởi động nhanh hơn</div>
                  <div>✓ Giao diện native trên thiết bị</div>
                  <div>✓ Không cần browser</div>
                  <div>✓ Tự động kích hoạt lưu trữ vĩnh viễn</div>
                </div>
              </div>
            </>
          )}

          {storage && !storage.isPersistent && !isInstalled() && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <Title level={5} className="!text-orange-400 !mb-2">
                💡 Để kích hoạt lưu trữ vĩnh viễn:
              </Title>
              <div className="text-orange-300 text-sm space-y-1">
                <div>• Cài đặt ứng dụng (PWA)</div>
                <div>• Thêm trang vào bookmark</div>
                <div>• Truy cập thường xuyên</div>
                <div>• Cho phép "Storage" trong site settings</div>
              </div>
            </div>
          )}
        </Space>
      </Modal>
    </>
  )
}

export default OfflineStatus
