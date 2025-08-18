// src/types/index.ts
export * from './monitoring'
export * from './logs'
export * from './signal.ts'

// 通用类型定义
export interface BaseResponse<T> {
  code: number
  message: string
  data?: T
  timestamp: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  code: number
  message: string
  details?: Record<string, unknown>
}
