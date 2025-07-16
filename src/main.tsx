import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App'

// Import offline manager
import offlineManager from './utils/offlineManager'

// Import PWA registration (if needed for manual control)
import { registerSW } from 'virtual:pwa-register'

// Dark theme configuration for Ant Design
const darkTheme = {
  token: {
    colorPrimary: '#8b5cf6',
    colorBgBase: '#1f2937',
    colorBgContainer: '#374151',
    colorText: '#ffffff',
    colorTextSecondary: '#d1d5db',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  components: {
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.1)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
    },
    Button: {
      colorBgContainer: 'rgba(255, 255, 255, 0.1)',
      colorBorder: 'rgba(255, 255, 255, 0.2)',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.1)',
      colorBorder: 'rgba(255, 255, 255, 0.2)',
    },
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.1)',
      colorBgElevated: '#374151',
    },
    Modal: {
      contentBg: '#1f2937',
      headerBg: '#1f2937',
    }
  }
}

// Declare global types for PWA
declare global {
  interface Window {
    updateSW?: (reloadPage?: boolean) => Promise<void>
  }
}

// Initialize offline functionality
console.log('Initializing offline manager...')

// Only register service worker in production to avoid dev reload issues
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

if (import.meta.env.PROD) {
  // Register service worker update handler
  updateSW = registerSW({
    onNeedRefresh() {
      console.log('App update available')
      // You can show a custom update prompt here
      offlineManager.notifyUpdate()
    },
    onOfflineReady() {
      console.log('App ready to work offline')
      // Notify user that app is ready for offline use
    },
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    }
  })
} else {
  console.log('Service worker disabled in development mode')
}

// Make updateSW available globally for offline manager
window.updateSW = updateSW

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <ConfigProvider theme={darkTheme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
)
