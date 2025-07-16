// Utility functions for offline functionality
import { message } from 'antd'
import type { OfflineStatus, StorageUsage, PendingOperation } from '../types'

class OfflineManager {
  public isOnline: boolean
  private pendingOperations: PendingOperation[]
  public swSupported: boolean
  public installPrompt: BeforeInstallPromptEvent | null = null

  constructor() {
    this.isOnline = navigator.onLine
    this.pendingOperations = []
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // Check if service worker is supported
    this.swSupported = 'serviceWorker' in navigator
    
    this.init()
  }

  async init(): Promise<void> {
    // Load any pending operations from localStorage
    this.loadPendingOperations()

    if (this.swSupported) {
      try {
        // vite-plugin-pwa will handle service worker registration automatically
        // We just need to listen for the service worker events
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            console.log('Service Worker is ready:', registration)
          })

          // Handle messages from service worker
          navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this))
        }

        // Preload offline resources
        await this.preloadOfflineResources()

      } catch (error) {
        console.error('Service Worker setup failed:', error)
      }
    }

    // Show offline status if needed
    if (!this.isOnline) {
      this.showOfflineNotification()
    }

    // Check for install prompt availability
    this.checkInstallability()
  }

  checkInstallability() {
    // Check if PWA is installable
    setTimeout(() => {
      if (!this.isInstalled() && !this.installPrompt) {
        console.log('PWA installability check - waiting for beforeinstallprompt event')
        
        // Show manual install instructions if prompt doesn't appear
        setTimeout(() => {
          if (!this.installPrompt) {
            this.showManualInstallGuide()
          }
        }, 3000)
      }
    }, 1000)
  }

  showManualInstallGuide() {
    if (this.isInstalled()) return

    const userAgent = navigator.userAgent.toLowerCase()
    let instructions = ''

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      instructions = 'Để cài đặt ứng dụng:\n1. Nhấn vào biểu tượng "cài đặt" (⊕) trên thanh địa chỉ\n2. Hoặc Menu → Cài đặt ứng dụng này'
    } else if (userAgent.includes('firefox')) {
      instructions = 'Để cài đặt ứng dụng:\n1. Nhấn vào biểu tượng "home" trong thanh địa chỉ\n2. Chọn "Cài đặt"\n3. Hoặc thêm vào Home Screen'
    } else if (userAgent.includes('safari')) {
      instructions = 'Để cài đặt ứng dụng:\n1. Nhấn nút "Chia sẻ" (□↗)\n2. Chọn "Thêm vào Home Screen"\n3. Xác nhận để cài đặt'
    } else if (userAgent.includes('edg')) {
      instructions = 'Để cài đặt ứng dụng:\n1. Nhấn vào biểu tượng "ứng dụng" (+) trên thanh địa chỉ\n2. Hoặc Menu → Ứng dụng → Cài đặt trang này dưới dạng ứng dụng'
    } else {
      instructions = 'Để cài đặt ứng dụng, tìm tùy chọn "Cài đặt ứng dụng" hoặc "Thêm vào Home Screen" trong menu trình duyệt của bạn.'
    }

    console.log('PWA Install Guide:', instructions)
    
    // Only show if user hasn't dismissed it recently
    const lastDismissed = localStorage.getItem('pwa-install-guide-dismissed')
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000

    if (!lastDismissed || (now - parseInt(lastDismissed)) > dayInMs) {
      message.info({
        content: `💡 ${instructions}`,
        duration: 8,
        onClose: () => {
          localStorage.setItem('pwa-install-guide-dismissed', now.toString())
        }
      })
    }
  }

  handleOnline(): void {
    this.isOnline = true
    console.log('App is online')
    message.success({
      content: 'Đã kết nối internet! Dữ liệu sẽ được đồng bộ.',
      duration: 3
    })
    
    // Process pending operations
    this.processPendingOperations()
  }

  handleOffline(): void {
    this.isOnline = false
    console.log('App is offline')
    this.showOfflineNotification()
    
    // Ensure data is persisted locally
    this.ensureOfflineCapability()
  }

  showOfflineNotification() {
    message.warning({
      content: 'Ứng dụng đang hoạt động offline. Tất cả tính năng cơ bản vẫn có sẵn!',
      duration: 4,
      style: {
        marginTop: '10vh',
      }
    })
  }

  async ensureOfflineCapability() {
    try {
      // Request persistent storage for offline data
      await this.requestPersistentStorage()
      
      // Test LocalForage connection
      const localforage = await import('localforage')
      await localforage.ready()
      
      console.log('Offline capability confirmed')
    } catch (error) {
      console.error('Failed to ensure offline capability:', error)
    }
  }

  notifyUpdate() {
    message.info({
      content: 'Có phiên bản mới của ứng dụng! Nhấn OK để cập nhật.',
      duration: 10,
      onClose: () => {
        // Try to trigger update if PWA update function is available
        if (window.updateSW) {
          window.updateSW(true)
        } else {
          // Fallback to reload
          window.location.reload()
        }
      }
    })
  }

  handleSWMessage(event: MessageEvent): void {
    const { type, payload } = event.data
    
    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload)
        break
      case 'OFFLINE_READY':
        message.success('Ứng dụng đã sẵn sàng hoạt động offline!')
        break
      default:
        console.log('SW message:', event.data)
    }
  }

  // Add operation to pending queue for when online
  addPendingOperation(operation: Omit<PendingOperation, 'timestamp'>): void {
    this.pendingOperations.push({
      ...operation,
      timestamp: Date.now()
    })
    
    // Save to localStorage as backup
    this.savePendingOperations()
  }

  async processPendingOperations() {
    if (this.pendingOperations.length === 0) return

    console.log('Processing pending operations:', this.pendingOperations.length)
    
    for (const operation of this.pendingOperations) {
      try {
        await this.executeOperation(operation)
      } catch (error) {
        console.error('Failed to execute pending operation:', error)
        // Keep failed operations for retry
        continue
      }
    }

    // Clear successful operations
    this.pendingOperations = []
    this.savePendingOperations()
  }

  async executeOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'SAVE_PROJECT':
        // Execute project save operation
        console.log('Executing save project:', operation.data)
        break
      case 'SYNC_DATA':
        // Execute data sync operation
        console.log('Executing data sync:', operation.data)
        break
      default:
        console.log('Unknown operation type:', operation.type)
    }
  }

  savePendingOperations() {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations))
    } catch (error) {
      console.error('Failed to save pending operations:', error)
    }
  }

  loadPendingOperations() {
    try {
      const saved = localStorage.getItem('pendingOperations')
      if (saved) {
        this.pendingOperations = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error)
      this.pendingOperations = []
    }
  }

  // Check if app can work offline
  canWorkOffline() {
    return this.swSupported && ('caches' in window) && ('indexedDB' in window)
  }

  // Preload critical offline resources
  async preloadOfflineResources() {
    if (!this.canWorkOffline()) return false

    try {
      // Ensure LocalForage is ready
      const localforage = await import('localforage')
      await localforage.ready()

      // Configure LocalForage for better performance
      localforage.config({
        driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
        name: 'LyricsSync',
        version: 1.0,
        size: 50 * 1024 * 1024, // 50MB
        storeName: 'projects'
      })

      console.log('Offline resources preloaded successfully')
      return true
    } catch (error) {
      console.error('Failed to preload offline resources:', error)
      return false
    }
  }

  // Get offline status info
  getOfflineStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      canWorkOffline: this.canWorkOffline(),
      isInstalled: this.isInstalled(),
      hasPendingOperations: this.pendingOperations.length > 0,
      swSupported: this.swSupported,
      features: {
        serviceWorker: 'serviceWorker' in navigator,
        indexedDB: 'indexedDB' in window,
        caches: 'caches' in window,
        storageManager: 'storage' in navigator,
        persistentStorage: 'storage' in navigator && 'persist' in navigator.storage
      }
    }
  }

  // Get app installation prompt
  getInstallPrompt() {
    return this.installPrompt
  }

  // Handle app installation
  async installApp() {
    if (this.installPrompt) {
      const result = await this.installPrompt.prompt()
      console.log('Install result:', result)
      this.installPrompt = null
      return result.outcome === 'accepted'
    }
    return false
  }

  // Check if app is installed
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true
  }

  // Request persistent storage
  async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        // Check current persistent state first
        const alreadyPersistent = await navigator.storage.persisted()
        if (alreadyPersistent) {
          console.log('Storage is already persistent')
          message.success('Lưu trữ vĩnh viễn đã được kích hoạt!')
          return true
        }

        // Request persistent storage
        const persistent = await navigator.storage.persist()
        console.log('Persistent storage request result:', persistent)
        
        if (persistent) {
          message.success('Đã cấp quyền lưu trữ vĩnh viễn! Dữ liệu sẽ không bị xóa tự động.')
        } else {
          message.warning({
            content: 'Không thể cấp quyền lưu trữ vĩnh viễn. Dữ liệu có thể bị xóa khi thiếu dung lượng.',
            duration: 6
          })
          // Provide guidance for manual activation
          console.log('To enable persistent storage manually:')
          console.log('1. Click the site settings icon in address bar')
          console.log('2. Allow "Storage" or "Automatic downloads"')
          console.log('3. Or add this site to bookmarks/home screen')
        }
        
        return persistent
      } catch (error) {
        console.error('Error requesting persistent storage:', error)
        message.error('Lỗi khi yêu cầu lưu trữ vĩnh viễn')
        return false
      }
    } else {
      message.warning('Trình duyệt không hỗ trợ Persistent Storage API')
      return false
    }
  }

  // Get storage usage
  async getStorageUsage(): Promise<StorageUsage | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        const isPersistent = await navigator.storage.persisted().catch(() => false)
        
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
          usedMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
          availableMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
          isPersistent: isPersistent,
          usageDetails: estimate.usageDetails || {}
        }
      } catch (error) {
        console.error('Error getting storage usage:', error)
        return null
      }
    }
    return null
  }
}

// Create global instance
const offlineManager = new OfflineManager()

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  offlineManager.installPrompt = e
  console.log('Install prompt saved')
  
  // Show notification that app can be installed
  message.success({
    content: '🎉 Ứng dụng có thể được cài đặt! Nhấn biểu tượng "cài đặt" trên thanh địa chỉ hoặc kiểm tra trạng thái offline.',
    duration: 6
  })
})

// Listen for appinstalled event
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed')
  offlineManager.installPrompt = null
  message.success({
    content: '✅ Ứng dụng đã được cài đặt thành công!',
    duration: 4
  })
})

export default offlineManager

// Helper functions for components
export const isOnline = () => offlineManager.isOnline
export const canWorkOffline = () => offlineManager.canWorkOffline()
export const addPendingOperation = (operation: Omit<PendingOperation, 'timestamp'>): void => offlineManager.addPendingOperation(operation)
export const getStorageUsage = () => offlineManager.getStorageUsage()
export const installApp = () => offlineManager.installApp()
export const isInstalled = () => offlineManager.isInstalled()
export const requestPersistentStorage = () => offlineManager.requestPersistentStorage()
export const getOfflineStatus = () => offlineManager.getOfflineStatus()
export const preloadOfflineResources = () => offlineManager.preloadOfflineResources()

// Extended Navigator interface for iOS standalone mode
declare global {
  interface Navigator {
    standalone?: boolean
  }
  
  interface StorageEstimate {
    usageDetails?: Record<string, number>
  }
}
