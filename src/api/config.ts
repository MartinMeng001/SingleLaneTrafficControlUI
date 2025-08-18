// src/api/config.ts
import axios from 'axios'

// 配置接口类型定义
export interface GlobalConfig {
  allRed: number
  maxAllRed: number
  regionNames?: string[] // 新增区域列表，可选字段
}

export interface SegmentConfig {
  name: string
  sigid: string
  allred: number
  upctrl: number
  downctrl: number
  inzone: number
  outzone: number
}

export interface HealthStatus {
  overallStatus: string
  configService?: {
    healthy: boolean
    status: string
    message: string
  }
  configFile?: {
    healthy: boolean
    exists: boolean
    lastModified: number
    status: string
  }
  systemResources?: {
    healthy: boolean
    memory?: {
      maxMemoryMB: number
      usedMemoryMB: number
      usagePercent: string
    }
    disk?: {
      freeSpaceGB: number
      usagePercent: string
    }
  }
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
  timestamp: string
}

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const CONFIG_API_URL = `${API_BASE_URL}/traffic-config/api`

// 创建axios实例
const configApi = axios.create({
  baseURL: CONFIG_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
configApi.interceptors.request.use(
  (config) => {
    console.log('API请求:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
configApi.interceptors.response.use(
  (response) => {
    console.log('API响应:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('响应错误:', error)
    const errorMessage = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(errorMessage))
  }
)

// 全局配置API
export const globalConfigApi = {
  // 获取全局配置
  getGlobalConfig: async (): Promise<GlobalConfig> => {
    const response = await configApi.get<GlobalConfig>('/config/global')
    return response.data
  },

  // 更新全局配置
  updateGlobalConfig: async (config: GlobalConfig): Promise<ApiResponse> => {
    const response = await configApi.put<ApiResponse>('/config/global', config)
    return response.data
  }
}

// 路段配置API
export const segmentConfigApi = {
  // 获取所有路段
  getAllSegments: async (): Promise<SegmentConfig[]> => {
    const response = await configApi.get<SegmentConfig[]>('/config/segments')
    return response.data
  },

  // 根据信号灯ID获取路段
  getSegmentById: async (sigid: string): Promise<SegmentConfig> => {
    const response = await configApi.get<SegmentConfig>(`/config/segments/${sigid}`)
    return response.data
  },

  // 根据名称获取路段
  getSegmentByName: async (name: string): Promise<SegmentConfig> => {
    const response = await configApi.get<SegmentConfig>(`/config/segments/byname/${encodeURIComponent(name)}`)
    return response.data
  },

  // 创建新路段
  createSegment: async (segment: SegmentConfig): Promise<ApiResponse> => {
    const response = await configApi.post<ApiResponse>('/config/segments', segment)
    return response.data
  },

  // 更新路段配置
  updateSegment: async (sigid: string, segment: SegmentConfig): Promise<ApiResponse> => {
    const response = await configApi.put<ApiResponse>(`/config/segments/${sigid}`, segment)
    return response.data
  },

  // 删除路段
  deleteSegment: async (sigid: string): Promise<ApiResponse> => {
    const response = await configApi.delete<ApiResponse>(`/config/segments/${sigid}`)
    return response.data
  }
}

// 系统管理API
export const systemApi = {
  // 刷新配置缓存
  refreshConfig: async (): Promise<ApiResponse> => {
    const response = await configApi.post<ApiResponse>('/config/refresh')
    return response.data
  },

  // 基础健康检查
  healthCheck: async (): Promise<ApiResponse<HealthStatus>> => {
    const response = await configApi.get<ApiResponse<HealthStatus>>('/health')
    return response.data
  },

  // 详细健康检查
  detailedHealthCheck: async (): Promise<ApiResponse<HealthStatus>> => {
    const response = await configApi.get<ApiResponse<HealthStatus>>('/health/detailed')
    return response.data
  },

  // 获取完整配置
  getFullConfig: async (): Promise<{
    global: GlobalConfig
    segments: {
      size: number
      segmentList: SegmentConfig[]
    }
  }> => {
    const response = await configApi.get('/config/full')
    return response.data
  },

  // 获取调试信息
  getDebugInfo: async (): Promise<unknown> => {
    const response = await configApi.get('/config/debug')
    return response.data
  }
}

// 测试API
export const testApi = {
  // Hello测试
  hello: async (): Promise<{
    message: string
    timestamp: string
    status: string
  }> => {
    const response = await axios.get(`${API_BASE_URL}/traffic-config/api/test/hello`)
    return response.data
  },

  // Ping测试
  ping: async (): Promise<string> => {
    const response = await axios.get(`${API_BASE_URL}/traffic-config/api/test/ping`)
    return response.data
  }
}

// 统一导出
export const configApiService = {
  global: globalConfigApi,
  segment: segmentConfigApi,
  system: systemApi,
  test: testApi
}

// 默认导出
export default configApiService
