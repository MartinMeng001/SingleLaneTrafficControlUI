// src/api/monitoring.ts
import axios from 'axios'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const MONITORING_API_URL = `${API_BASE_URL}/api`

// 监控相关响应类型定义
export interface ResetEventResponse {
  success: boolean
  message: string
  event: string
  eventCode: string
  timestamp: number
  eventCounter: number
}

// 创建axios实例
const monitoringApi = axios.create({
  baseURL: MONITORING_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 请求拦截器
monitoringApi.interceptors.request.use(
  (config) => {
    console.log('监控API请求:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('监控API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
monitoringApi.interceptors.response.use(
  (response) => {
    console.log('监控API响应:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('监控API响应错误:', error)
    const errorMessage = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(errorMessage))
  }
)

// 监控API服务
export const monitoringApiService = {
  /**
   * 系统重置接口
   * 连接格式：${API_BASE_URL}/traffic-config/api/test/vehicle-events
   * 无参数
   */
  reset: async (): Promise<ResetEventResponse> => {
    try {
      const response = await monitoringApi.get<ResetEventResponse>('/test/vehicle-events/reset')
      return response.data
    } catch (error) {
      console.error('系统重置失败:', error)
      throw error
    }
  }
}

// 默认导出
export default monitoringApiService
