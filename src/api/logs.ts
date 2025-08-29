// src/api/log.ts
import axios from 'axios'

// ========== 类型定义 ==========

// 通用响应格式
export interface LogApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
  timestamp: string
  success: boolean
  traceId?: string
}

// 日志条目
export interface LogEntry {
  id: number
  logType: LogType
  logLevel: LogLevel
  logContent: string
  createTime: string
  module?: string
  entityId?: string
  operator?: string
  extInfo?: string
}

// 日志类型枚举
export type LogType =
  | 'VEHICLE_EVENT'     // 车辆事件
  | 'SEGMENT_STATUS'    // 路段状态
  | 'CONFLICT_ALERT'    // 冲突告警
  | 'DETECTOR_ERROR'    // 检测器错误
  | 'SENSOR_STATUS'     // 传感器状态
  | 'SYSTEM_EVENT'      // 系统事件

// 日志级别枚举
export type LogLevel =
  | 'DEBUG'    // 调试
  | 'INFO'     // 信息
  | 'WARN'     // 警告
  | 'ERROR'    // 错误

// 分页查询参数
export interface LogQueryParams {
  logType?: LogType
  logLevel?: LogLevel
  startTime?: string
  endTime?: string
  module?: string
  entityId?: string
  page?: number
  size?: number
  timeRange?: '' | '1h' | '6h' | '24h' | '7d' | '30d' // Restrict to valid values
}

// 分页响应
export interface PagedLogResponse {
  content: LogEntry[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
}

// 内容搜索参数
export interface LogSearchParams {
  keyword: string
  page?: number
  size?: number
}

// 日志统计信息
export interface LogStatistics {
  totalCount: number
  errorCount: number
  warnCount: number
  todayCount: number
  typeStatistics: Record<LogType, number>
  levelStatistics: Record<LogLevel, number>
  generateTime: string
}

// 日志添加参数
export interface CreateLogParams {
  logType: LogType
  logLevel: LogLevel
  logContent: string
  entityId?: string
  module?: string
  operator?: string
  extInfo?: string
}

// 清理结果
export interface CleanupResult {
  deletedCount: number
  cutoffDays: number
  cleanupTime: string
}

// ========== API配置 ==========

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const LOGS_API_URL = `${API_BASE_URL}/api/logs`

// 创建axios实例
const logApi = axios.create({
  baseURL: LOGS_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 请求拦截器
logApi.interceptors.request.use(
  (config) => {
    console.log('日志API请求:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('日志API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
logApi.interceptors.response.use(
  (response) => {
    console.log('日志API响应:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('日志API响应错误:', error)
    const errorMessage = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(errorMessage))
  }
)

// ========== API服务 ==========

export const logApiService = {
  // ========== 1. 日志查询接口 ==========

  /**
   * 分页查询日志
   * GET /api/logs
   */
  getLogs: async (params: LogQueryParams = {}): Promise<LogApiResponse<PagedLogResponse>> => {
    try {
      const response = await logApi.get<LogApiResponse<PagedLogResponse>>('', { params })
      return response.data
    } catch (error) {
      console.error('分页查询日志失败:', error)
      throw error
    }
  },

  /**
   * 根据ID获取日志详情
   * GET /api/logs/{id}
   */
  getLogById: async (id: number): Promise<LogApiResponse<LogEntry>> => {
    try {
      const response = await logApi.get<LogApiResponse<LogEntry>>(`/${id}`)
      return response.data
    } catch (error) {
      console.error('获取日志详情失败:', error)
      throw error
    }
  },

  /**
   * 内容搜索
   * GET /api/logs/search
   */
  searchLogs: async (params: LogSearchParams): Promise<LogApiResponse<PagedLogResponse>> => {
    try {
      const response = await logApi.get<LogApiResponse<PagedLogResponse>>('/search', { params })
      return response.data
    } catch (error) {
      console.error('搜索日志失败:', error)
      throw error
    }
  },

  /**
   * 获取最新日志
   * GET /api/logs/recent
   */
  getRecentLogs: async (limit: number = 50): Promise<LogApiResponse<LogEntry[]>> => {
    try {
      const response = await logApi.get<LogApiResponse<LogEntry[]>>('/recent', {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('获取最新日志失败:', error)
      throw error
    }
  },

  /**
   * 获取系统健康日志
   * GET /api/logs/health
   */
  getHealthLogs: async (hours: number = 24): Promise<LogApiResponse<LogEntry[]>> => {
    try {
      const response = await logApi.get<LogApiResponse<LogEntry[]>>('/health', {
        params: { hours }
      })
      return response.data
    } catch (error) {
      console.error('获取系统健康日志失败:', error)
      throw error
    }
  },

  /**
   * 获取活跃告警
   * GET /api/logs/alerts
   */
  getActiveAlerts: async (minutes: number = 30): Promise<LogApiResponse<LogEntry[]>> => {
    try {
      const response = await logApi.get<LogApiResponse<LogEntry[]>>('/alerts', {
        params: { minutes }
      })
      return response.data
    } catch (error) {
      console.error('获取活跃告警失败:', error)
      throw error
    }
  },

  // ========== 2. 日志添加接口 ==========

  /**
   * 添加单个日志
   * POST /api/logs
   */
  createLog: async (logData: CreateLogParams): Promise<LogApiResponse<LogEntry>> => {
    try {
      const response = await logApi.post<LogApiResponse<LogEntry>>('', logData)
      return response.data
    } catch (error) {
      console.error('添加日志失败:', error)
      throw error
    }
  },

  /**
   * 批量添加日志
   * POST /api/logs/batch
   */
  createLogsBatch: async (logsData: CreateLogParams[]): Promise<LogApiResponse<LogEntry[]>> => {
    try {
      if (logsData.length > 1000) {
        throw new Error('批量添加日志最多支持1000条')
      }
      const response = await logApi.post<LogApiResponse<LogEntry[]>>('/batch', logsData)
      return response.data
    } catch (error) {
      console.error('批量添加日志失败:', error)
      throw error
    }
  },

  // ========== 3. 便捷日志记录接口 ==========

  /**
   * 记录车辆事件
   * POST /api/logs/vehicle
   */
  logVehicleEvent: async (params: {
    level: LogLevel
    content: string
    vehicleId: string
  }): Promise<LogApiResponse<string>> => {
    try {
      const formData = new URLSearchParams()
      formData.append('level', params.level)
      formData.append('content', params.content)
      formData.append('vehicleId', params.vehicleId)

      const response = await logApi.post<LogApiResponse<string>>('/vehicle', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return response.data
    } catch (error) {
      console.error('记录车辆事件失败:', error)
      throw error
    }
  },

  /**
   * 记录路段状态
   * POST /api/logs/segment
   */
  logSegmentStatus: async (params: {
    level: LogLevel
    content: string
    segmentId: string
  }): Promise<LogApiResponse<string>> => {
    try {
      const formData = new URLSearchParams()
      formData.append('level', params.level)
      formData.append('content', params.content)
      formData.append('segmentId', params.segmentId)

      const response = await logApi.post<LogApiResponse<string>>('/segment', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return response.data
    } catch (error) {
      console.error('记录路段状态失败:', error)
      throw error
    }
  },

  /**
   * 记录系统事件
   * POST /api/logs/system
   */
  logSystemEvent: async (params: {
    level: LogLevel
    content: string
    module?: string
    entityId?: string
  }): Promise<LogApiResponse<string>> => {
    try {
      const formData = new URLSearchParams()
      formData.append('level', params.level)
      formData.append('content', params.content)
      if (params.module) formData.append('module', params.module)
      if (params.entityId) formData.append('entityId', params.entityId)

      const response = await logApi.post<LogApiResponse<string>>('/system', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return response.data
    } catch (error) {
      console.error('记录系统事件失败:', error)
      throw error
    }
  },

  // ========== 4. 日志删除接口 ==========

  /**
   * 删除单个日志
   * DELETE /api/logs/{id}
   */
  deleteLog: async (id: number): Promise<LogApiResponse<string>> => {
    try {
      const response = await logApi.delete<LogApiResponse<string>>(`/${id}`)
      return response.data
    } catch (error) {
      console.error('删除日志失败:', error)
      throw error
    }
  },

  /**
   * 批量删除日志
   * DELETE /api/logs/batch
   */
  deleteLogsBatch: async (ids: number[]): Promise<LogApiResponse<string>> => {
    try {
      if (ids.length > 1000) {
        throw new Error('批量删除日志最多支持1000条')
      }
      const response = await logApi.delete<LogApiResponse<string>>('/batch', {
        data: ids
      })
      return response.data
    } catch (error) {
      console.error('批量删除日志失败:', error)
      throw error
    }
  },

  /**
   * 清理过期日志
   * DELETE /api/logs/cleanup
   */
  cleanupExpiredLogs: async (days: number = 30): Promise<LogApiResponse<CleanupResult>> => {
    try {
      const response = await logApi.delete<LogApiResponse<CleanupResult>>('/cleanup', {
        params: { days }
      })
      return response.data
    } catch (error) {
      console.error('清理过期日志失败:', error)
      throw error
    }
  },

  // ========== 5. 统计和管理接口 ==========

  /**
   * 获取日志统计信息
   * GET /api/logs/statistics
   */
  getLogStatistics: async (): Promise<LogApiResponse<LogStatistics>> => {
    try {
      const response = await logApi.get<LogApiResponse<LogStatistics>>('/statistics')
      return response.data
    } catch (error) {
      console.error('获取日志统计信息失败:', error)
      throw error
    }
  },

  /**
   * 获取日志类型列表
   * GET /api/logs/types
   */
  getLogTypes: async (): Promise<LogApiResponse<Record<LogType, string>>> => {
    try {
      const response = await logApi.get<LogApiResponse<Record<LogType, string>>>('/types')
      return response.data
    } catch (error) {
      console.error('获取日志类型列表失败:', error)
      throw error
    }
  },

  /**
   * 获取日志级别列表
   * GET /api/logs/levels
   */
  getLogLevels: async (): Promise<LogApiResponse<Record<LogLevel, string>>> => {
    try {
      const response = await logApi.get<LogApiResponse<Record<LogLevel, string>>>('/levels')
      return response.data
    } catch (error) {
      console.error('获取日志级别列表失败:', error)
      throw error
    }
  }
}

// ========== 便捷工具函数 ==========

/**
 * 日志类型显示文本映射
 */
export const LOG_TYPE_LABELS: Record<LogType, string> = {
  'VEHICLE_EVENT': '车辆事件',
  'SEGMENT_STATUS': '路段状态',
  'CONFLICT_ALERT': '冲突告警',
  'DETECTOR_ERROR': '检测器错误',
  'SENSOR_STATUS': '传感器状态',
  'SYSTEM_EVENT': '系统事件'
}

/**
 * 日志级别显示文本映射
 */
export const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  'DEBUG': '调试',
  'INFO': '信息',
  'WARN': '警告',
  'ERROR': '错误'
}

/**
 * 获取日志类型显示文本
 */
export const getLogTypeLabel = (type: LogType): string => {
  return LOG_TYPE_LABELS[type] || type
}

/**
 * 获取日志级别显示文本
 */
export const getLogLevelLabel = (level: LogLevel): string => {
  return LOG_LEVEL_LABELS[level] || level
}

/**
 * 获取日志级别对应的CSS类名
 */
export const getLogLevelClass = (level: LogLevel): string => {
  const classMap: Record<LogLevel, string> = {
    'DEBUG': 'debug',
    'INFO': 'info',
    'WARN': 'warning',
    'ERROR': 'error'
  }
  return classMap[level] || 'info'
}

/**
 * 格式化时间字符串
 */
export const formatLogTime = (timeStr: string): string => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (_error) {
    return timeStr
  }
}

/**
 * 构建时间范围查询参数
 */
export const buildTimeRangeParams = (range: string): { startTime?: string; endTime?: string } => {
  const now = new Date()
  const endTime = now.toISOString().slice(0, 19).replace('T', ' ')

  let startTime: string | undefined

  switch (range) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      break
    case '6h':
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      break
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      break
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      break
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      break
  }

  return startTime ? { startTime, endTime } : {}
}

// 默认导出
export default logApiService
