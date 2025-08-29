// src/api/configService.ts
// 基于新的ConfigController API接口文档的服务模块

import axios, {AxiosRequestConfig} from 'axios' //, { Method }

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  timestamp: number
  status?: number
}

export interface GlobalConfig {
  allRed: number
  maxAllRed: number
  platformUrl?: string
  signalList?: {
    signals: Signal[]
  }
  signalNames?: string[]
}

export interface Signal {
  name: string
  //id: string
}

export interface SegmentConfig {
  segmentId: number
  name: string
  length: number
  minRed: number
  maxRed: number
  minGreen: number
  maxGreen: number
  upsigid: string
  downsigid: string
}

export interface WaitingArea {
  index: number
  upCapacity: number
  downCapacity: number
}

export interface DetectPoint {
  index: number
  details: string
}

export interface FullConfig {
  global: GlobalConfig
  segments: {
    size: number
    segmentList: SegmentConfig[]
  }
  detectPoints: {
    detectPointList: DetectPoint[]
  }
  waitingAreas: {
    waitingAreas: WaitingArea[]
  }
}

export interface HealthStatus {
  success: boolean
  message: string
  configExists?: boolean
  timestamp?: number
}

export interface ConstraintsInfo {
  rules: Record<string, string>
  allowedOperations: Record<string, string[]>
  version?: string
  lastUpdated?: number
}

export interface DebugInfo {
  configLoaded: boolean
  segmentsCount: number
  detectPointsCount: number
  waitingAreasCount: number
  globalConfigExists: boolean
  detectPointsReadonly: boolean
  constraints: {
    allowModifyGlobal: boolean
    allowModifySegments: boolean
    allowModifyDetectPoints: boolean
    allowModifyWaitingAreas: boolean
    allowAddDelete: boolean
  }
}

// API基础配置 - 按照现有config.ts的方式
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
const CONFIG_API_URL = `${API_BASE_URL}/api/config`

// 创建axios实例 - 遵循现有的模式
const configApi = axios.create({
  baseURL: CONFIG_API_URL,
  timeout: parseInt(import.meta.env.VITE_CONFIG_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 与现有config.ts保持一致
configApi.interceptors.request.use(
  (config) => {
    console.log('配置API请求:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('配置API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 与现有config.ts保持一致
configApi.interceptors.response.use(
  (response) => {
    console.log('配置API响应:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('配置API响应错误:', error)
    const errorMessage = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(errorMessage))
  }
)

class ConfigApiService {
  /**
   * 通用API调用方法
   */
  private async apiCall<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | undefined> {
    // 使用axios实例而不是fetch
    try {
      let headers: { [key: string]: string } = {};
      if (options.headers) {
        if (options.headers instanceof Headers) {
          headers = Object.fromEntries(options.headers.entries());
        } else if (Array.isArray(options.headers)) {
          headers = Object.fromEntries(options.headers);
        } else {
          headers = options.headers as { [key: string]: string };
        }
      }

      const axiosConfig: AxiosRequestConfig = {
        method: options.method || 'GET',
        url: endpoint,
        data: options.body ? JSON.parse(options.body as string) : undefined,
        headers
      };
      const response = await configApi.request(axiosConfig);
      return response.data as T;
    } catch (error: unknown) {
      if(error instanceof Error) {
        throw new Error(error.message || '请求失败')
      }
    }
  }

  // ===========================================
  // 🔍 查询接口
  // ===========================================

  /**
   * 获取完整配置
   */
  async getFullConfig(): Promise<FullConfig | undefined> {
    return this.apiCall<FullConfig>('/full')
  }

  /**
   * 获取全局配置
   */
  async getGlobalConfig(): Promise<GlobalConfig | undefined> {
    return this.apiCall<GlobalConfig>('/global')
  }

  /**
   * 获取所有路段配置
   */
  async getAllSegments(): Promise<SegmentConfig[] | undefined> {
    return this.apiCall<SegmentConfig[]>('/segments')
  }

  /**
   * 根据信号灯ID获取路段配置
   */
  async getSegmentBySigId(sigid: string): Promise<SegmentConfig | undefined> {
    return this.apiCall<SegmentConfig>(`/segments/${sigid}`)
  }

  /**
   * 根据名称获取路段配置
   */
  async getSegmentByName(name: string): Promise<SegmentConfig | undefined> {
    return this.apiCall<SegmentConfig>(`/segments/byname/${encodeURIComponent(name)}`)
  }

  /**
   * 获取所有检测点配置（只读）
   */
  async getAllDetectPoints(): Promise<DetectPoint[] | undefined> {
    return this.apiCall<DetectPoint[]>('/detectpoints')
  }

  /**
   * 根据索引获取检测点配置（只读）
   */
  async getDetectPointByIndex(index: number): Promise<DetectPoint | undefined> {
    return this.apiCall<DetectPoint>(`/detectpoints/${index}`)
  }

  /**
   * 获取所有等待区配置
   */
  async getAllWaitingAreas(): Promise<WaitingArea[] | undefined> {
    return this.apiCall<WaitingArea[]>('/waitingareas')
  }

  /**
   * 根据索引获取等待区配置
   */
  async getWaitingAreaByIndex(index: number): Promise<WaitingArea | undefined> {
    return this.apiCall<WaitingArea>(`/waitingareas/${index}`)
  }

  // ===========================================
  // ✏️ 修改接口
  // ===========================================

  /**
   * 更新全局配置（仅允许修改AllRed和MaxAllRed）
   */
  async updateGlobalConfig(config: Pick<GlobalConfig, 'allRed' | 'maxAllRed'>): Promise<ApiResponse<GlobalConfig> | undefined> {
    return this.apiCall<ApiResponse<GlobalConfig>>('/global', {
      method: 'PUT',
      body: JSON.stringify(config)
    })
  }

  /**
   * 更新路段配置（不允许修改segmentId和upsigid）
   */
  async updateSegmentConfig(sigid: string, config: SegmentConfig): Promise<ApiResponse<SegmentConfig> | undefined> {
    return this.apiCall<ApiResponse<SegmentConfig>>(`/segments/${sigid}`, {
      method: 'PUT',
      body: JSON.stringify(config)
    })
  }

  /**
   * 更新等待区配置（不允许修改index）
   */
  async updateWaitingAreaConfig(index: number, config: WaitingArea): Promise<ApiResponse<WaitingArea> | undefined> {
    return this.apiCall<ApiResponse<WaitingArea>>(`/waitingareas/${index}`, {
      method: 'PUT',
      body: JSON.stringify(config)
    })
  }

  // ===========================================
  // 🛠️ 工具接口
  // ===========================================

  /**
   * 刷新配置缓存
   */
  async refreshConfig(): Promise<ApiResponse | undefined> {
    return this.apiCall<ApiResponse>('/refresh', {
      method: 'POST'
    })
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<HealthStatus | undefined> {
    return this.apiCall<HealthStatus>('/health')
  }

  /**
   * 获取配置约束说明
   */
  async getConstraints(): Promise<ConstraintsInfo | undefined> {
    return this.apiCall<ConstraintsInfo>('/constraints')
  }

  /**
   * 调试配置信息
   */
  async getDebugInfo(): Promise<DebugInfo | undefined> {
    return this.apiCall<DebugInfo>('/debug')
  }

  // ===========================================
  // 🚫 禁止操作检查方法
  // ===========================================

  /**
   * 检查操作是否被允许
   * 根据API文档约束，某些操作是被禁止的
   */
  checkOperationAllowed(operation: string): { allowed: boolean; reason?: string } {
    const forbiddenOperations = {
      'POST /segments': '不允许添加新的路段配置，只能修改现有路段参数',
      'DELETE /segments': '不允许删除路段配置，只能修改现有路段参数',
      'POST /detectpoints': '检测点配置为只读，不允许修改/添加/删除',
      'PUT /detectpoints': '检测点配置为只读，不允许修改/添加/删除',
      'DELETE /detectpoints': '检测点配置为只读，不允许修改/添加/删除',
      'POST /waitingareas': '不允许添加等待区配置，只能修改现有等待区参数',
      'DELETE /waitingareas': '不允许删除等待区配置，只能修改现有等待区参数'
    }

    const normalizedOp = operation.toUpperCase()
    const reason = forbiddenOperations[normalizedOp as keyof typeof forbiddenOperations]

    return {
      allowed: !reason,
      reason
    }
  }

  // ===========================================
  // 🔧 辅助方法
  // ===========================================

  /**
   * 验证全局配置参数
   */
  validateGlobalConfig(config: Pick<GlobalConfig, 'allRed' | 'maxAllRed'>): {
    valid: boolean
    errors: Record<string, string>
  } {
    const errors: Record<string, string> = {}

    if (config.allRed < 1 || config.allRed > 600) {
      errors.allRed = 'AllRed参数必须在1-600秒之间'
    }

    if (config.maxAllRed < 1 || config.maxAllRed > 1200) {
      errors.maxAllRed = 'MaxAllRed参数必须在1-1200秒之间'
    }

    if (config.allRed > config.maxAllRed) {
      errors.maxAllRed = 'MaxAllRed必须大于等于AllRed'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 验证路段配置参数
   */
  validateSegmentConfig(config: SegmentConfig): {
    valid: boolean
    errors: Record<string, string>
  } {
    const errors: Record<string, string> = {}

    if (!config.name.trim()) {
      errors.name = '路段名称不能为空'
    }

    if (config.length <= 0) {
      errors.length = '路段长度必须大于0'
    }

    if (config.minRed <= 0) {
      errors.minRed = '最小红灯时间必须大于0'
    }

    if (config.maxRed <= 0) {
      errors.maxRed = '最大红灯时间必须大于0'
    }

    if (config.minRed > config.maxRed) {
      errors.maxRed = '最大红灯时间必须大于等于最小红灯时间'
    }

    if (config.minGreen <= 0) {
      errors.minGreen = '最小绿灯时间必须大于0'
    }

    if (config.maxGreen <= 0) {
      errors.maxGreen = '最大绿灯时间必须大于0'
    }

    if (config.minGreen > config.maxGreen) {
      errors.maxGreen = '最大绿灯时间必须大于等于最小绿灯时间'
    }

    if (!config.downsigid.trim()) {
      errors.downsigid = '下行信号ID不能为空'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 验证等待区配置参数
   */
  validateWaitingAreaConfig(config: WaitingArea): {
    valid: boolean
    errors: Record<string, string>
  } {
    const errors: Record<string, string> = {}

    if (config.upCapacity < 1 || config.upCapacity > 100) {
      errors.upCapacity = '上行容量必须在1-100之间'
    }

    if (config.downCapacity < 1 || config.downCapacity > 100) {
      errors.downCapacity = '下行容量必须在1-100之间'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * 格式化时间戳
   */
  formatTimestamp(timestamp?: number): string {
    if (!timestamp) return '未知'
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * 处理API错误
   */
  handleApiError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    // if (error?.message) {
    //   return error.message
    // }
    return '未知错误'
  }

  /**
   * 设置API基础URL
   */
  setBaseUrl(newBaseUrl: string): void {
    // 更新axios实例的baseURL
    configApi.defaults.baseURL = `${newBaseUrl}/traffic-config/api/config`
  }

  /**
   * 获取当前API基础URL
   */
  getBaseUrl(): string {
    return configApi.defaults.baseURL || CONFIG_API_URL
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now()
    try {
      await this.healthCheck()
      const latency = Date.now() - startTime
      return {
        success: true,
        message: '连接成功',
        latency
      }
    } catch (error) {
      return {
        success: false,
        message: this.handleApiError(error)
      }
    }
  }
}

// 创建单例实例
export const newConfigApiService = new ConfigApiService()

// 导出服务类供需要时直接实例化
export { ConfigApiService }

// 导出常用的错误处理工具
export const ConfigApiErrors = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR'
} as const

// 导出约束检查工具
export const ConfigConstraints = {
  GLOBAL_CONFIG: {
    ALL_RED: { min: 1, max: 600 },
    MAX_ALL_RED: { min: 1, max: 1200 }
  },
  WAITING_AREA: {
    CAPACITY: { min: 1, max: 100 }
  },
  READONLY_FIELDS: [
    'segmentId',
    'upsigid',
    'detectPoints',
    'signalControllerList',
    'platformUrl'
  ],
  FORBIDDEN_OPERATIONS: [
    'POST /segments',
    'DELETE /segments',
    'POST /detectpoints',
    'PUT /detectpoints',
    'DELETE /detectpoints',
    'POST /waitingareas',
    'DELETE /waitingareas'
  ]
} as const
