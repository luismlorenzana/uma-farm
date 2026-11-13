/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_BUILD_ID__: string

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  /** '1' plays the romance core on save v4: the dev server and the romance build only. */
  readonly VITE_FARM_ROMANCE?: string
  /** 'stand-in' plays the invented stand-in pack without asking farm-api: the dev server and Vitest only. */
  readonly VITE_FARM_STORY?: string
}
