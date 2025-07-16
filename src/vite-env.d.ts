/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Type declarations for virtual modules

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}

declare module 'virtual:pwa-register/react' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}

// Extend Window interface
declare global {
  interface Window {
    updateSW?: (reloadPage?: boolean) => Promise<void>
    // Add beforeinstallprompt for PWA
    addEventListener(type: 'beforeinstallprompt', listener: (event: BeforeInstallPromptEvent) => void): void
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<{outcome: 'accepted' | 'dismissed', platform: string}>
    userChoice: Promise<{outcome: 'accepted' | 'dismissed', platform: string}>
  }
}

export {}
