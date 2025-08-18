/// <reference types="vite/client" />

// Vite 环境变量类型定义
interface ImportMetaEnv {
  // 基础环境变量
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string

  // TrafficConfigSystem API 相关
  readonly VITE_CONFIG_API_TIMEOUT: string
  readonly VITE_CONFIG_API_RETRY_COUNT: string
  readonly VITE_ENABLE_API_MOCK: string

  // 开发环境配置
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_ENABLE_CONSOLE_LOG: string
  readonly VITE_DEBUG_MODE: string

  // 功能开关
  readonly VITE_ENABLE_CONFIG_EXPORT: string
  readonly VITE_ENABLE_HEALTH_CHECK: string
  readonly VITE_ENABLE_AUTO_REFRESH: string

  // 监控和分析
  readonly VITE_ENABLE_ERROR_TRACKING: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_GA_TRACKING_ID: string

  // 主题和样式
  readonly VITE_DEFAULT_THEME: string
  readonly VITE_ENABLE_DARK_MODE: string
  readonly VITE_PRIMARY_COLOR: string

  // 安全配置
  readonly VITE_ENABLE_AUTH: string
  readonly VITE_AUTH_PROVIDER: string
  readonly VITE_JWT_SECRET: string

  // 缓存配置
  readonly VITE_ENABLE_CACHE: string
  readonly VITE_CACHE_TTL: string

  // 其他自定义环境变量
  readonly VITE_BUILD_TIME: string
  readonly VITE_BUILD_HASH: string
  readonly VITE_DEPLOYMENT_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Vue 组件类型扩展
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 静态资源类型
declare module '*.svg' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.ico' {
  const src: string
  export default src
}

// CSS 模块类型
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.styl' {
  const classes: { readonly [key: string]: string }
  export default classes
}

// JSON 文件类型
declare module '*.json' {
  const value: any
  export default value
}

// 文本文件类型
declare module '*.txt' {
  const content: string
  export default content
}

declare module '*.md' {
  const content: string
  export default content
}

// Web Workers
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}

// WASM 模块
declare module '*.wasm' {
  const wasmModule: WebAssembly.Module
  export default wasmModule
}

// 全局类型扩展
declare global {
  // 全局常量
  const __APP_VERSION__: string
  const __BUILD_TIME__: string
  const __IS_DEV__: boolean
  const __IS_PROD__: boolean

  // 自定义全局属性
  interface Window {
    // TrafficConfigSystem 相关
    __TRAFFIC_CONFIG__?: {
      version: string
      buildTime: string
      debugMode: boolean
    }

    // 开发工具
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: any
    __VUE_OPTIONS_API__?: boolean
    __VUE_PROD_DEVTOOLS__?: boolean

    // 第三方库
    gtag?: (...args: any[]) => void
    Sentry?: any

    // 自定义事件
    trafficConfigLoaded?: boolean
    configUpdateCallback?: (config: any) => void
  }

  // 环境变量快捷访问
  const VITE_API_BASE_URL: string
  const VITE_APP_TITLE: string
  const VITE_APP_VERSION: string
}

// Node.js 环境变量 (用于构建时)
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    VITE_APP_TITLE: string
    VITE_APP_VERSION: string
    VITE_API_BASE_URL: string
    VITE_WS_URL: string
  }
}

// 扩展 console 类型 (开发时使用)
interface Console {
  traffic: {
    log: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    debug: (...args: any[]) => void
  }
}

export {}
