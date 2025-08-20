// src/services/vehicleTestApi.ts
/**
 * 车辆测试API服务
 * 基于单通道测试接口说明实现
 */

// API响应类型定义
export interface TestInfoResponse {
  feature: string
  description: string
  test_license_plate_1: string
  test_license_plate_2: string
  supported_segments: number[]
  directions: string[]
  actions: string[]
  timestamp: string
}

export interface VehicleEventResponse {
  message: string
  segmentId: number
  event: string
  eventCode: string
  licensePlate: string
  direction: string
  action: string
  timestamp: string
  eventCounter: number
}

export interface ControlEventResponse {
  success: boolean
  message: string
  segmentId: number
  ctrlPhase: string
  timestamp: string
}

export interface EventHistoryResponse {
  totalEvents: number
  history: Record<string, EventHistoryItem>
  timestamp: string
}

export interface EventHistoryItem {
  eventId: number
  segmentId: number
  event: string
  licensePlate: string
  timestamp: string
}

export interface StatusResponse {
  feature: string
  status: string
  totalTriggeredEvents: number
  testLicensePlates: string[]
  supportedSegments: number[]
  timestamp: string
}

export interface HealthResponse {
  status: string
  service: string
  segmentStateMachineV3Service: string
  timestamp: string
}

export interface ClearHistoryResponse {
  success: boolean
  message: string
  clearedCount: number
  timestamp: string
}

// API配置
class VehicleTestApiConfig {
  private static readonly BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/test/vehicle-events`

  // 构建URL的辅助方法
  static getInfoUrl(): string {
    return `${this.BASE_URL}/info`
  }

  static getVehicleEventUrl(segmentId: number, direction: string, action: string): string {
    return `${this.BASE_URL}/segment${segmentId}/${direction}/${action}`
  }

  static getControlEventUrl(segmentId: number, ctrlPhase: string): string {
    return `${this.BASE_URL}/segment/${segmentId}/control/${ctrlPhase}`
  }

  static getHistoryUrl(): string {
    return `${this.BASE_URL}/history`
  }

  static getClearHistoryUrl(): string {
    return `${this.BASE_URL}/history/clear`
  }

  static getStatusUrl(): string {
    return `${this.BASE_URL}/status`
  }

  static getHealthUrl(): string {
    return `${this.BASE_URL}/health`
  }
}

// HTTP客户端封装
class HttpClient {
  private static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options
    }

    try {
      console.log(`🌐 API请求: ${options.method || 'GET'} ${url}`)

      const response = await fetch(url, defaultOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ API响应: ${url}`, data)

      return data
    } catch (error) {
      console.error(`❌ API请求失败: ${url}`, error)
      throw error
    }
  }

  static async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' })
  }

  static async post<T>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    })
  }
}

/**
 * 车辆测试API服务主类
 */
export class VehicleTestApiService {

  /**
   * 1. 获取测试功能说明
   */
  static async getTestInfo(): Promise<TestInfoResponse> {
    return HttpClient.get<TestInfoResponse>(
      VehicleTestApiConfig.getInfoUrl()
    )
  }

  /**
   * 2. 手动触发车辆事件
   * @param segmentId 路段ID (1-4)
   * @param direction 方向 ("upstream" | "downstream")
   * @param action 动作 ("enter" | "exit")
   * @param licensePlate 车牌号（可选）
   */
  static async triggerVehicleEvent(
    segmentId: number,
    direction: 'upstream' | 'downstream',
    action: 'enter' | 'exit',
    licensePlate?: string
  ): Promise<VehicleEventResponse> {
    // 验证参数
    if (![1, 2, 3, 4].includes(segmentId)) {
      throw new Error(`无效的路段ID: ${segmentId}`)
    }

    if (!['upstream', 'downstream'].includes(direction)) {
      throw new Error(`无效的方向: ${direction}`)
    }

    if (!['enter', 'exit'].includes(action)) {
      throw new Error(`无效的动作: ${action}`)
    }

    let url = VehicleTestApiConfig.getVehicleEventUrl(segmentId, direction, action)

    // 添加车牌号参数
    if (licensePlate && licensePlate.trim()) {
      url += `?licensePlate=${encodeURIComponent(licensePlate.trim())}`
    }

    return HttpClient.post<VehicleEventResponse>(url)
  }

  /**
   * 3. 强控接口
   * @param segmentId 路段ID (1-4)
   * @param ctrlPhase 控制阶段 ("RED" | "YF" | "UP" | "DOWN")
   */
  static async triggerControlEvent(
    segmentId: number,
    ctrlPhase: 'RED' | 'YF' | 'UP' | 'DOWN'
  ): Promise<ControlEventResponse> {
    // 验证参数
    if (![1, 2, 3, 4].includes(segmentId)) {
      throw new Error(`无效的路段ID: ${segmentId}`)
    }

    if (!['RED', 'YF', 'UP', 'DOWN'].includes(ctrlPhase)) {
      throw new Error(`无效的控制阶段: ${ctrlPhase}`)
    }

    const url = VehicleTestApiConfig.getControlEventUrl(segmentId, ctrlPhase)
    return HttpClient.post<ControlEventResponse>(url)
  }

  /**
   * 4. 获取事件历史记录
   */
  static async getEventHistory(): Promise<EventHistoryResponse> {
    return HttpClient.get<EventHistoryResponse>(
      VehicleTestApiConfig.getHistoryUrl()
    )
  }

  /**
   * 5. 清除事件历史记录
   */
  static async clearEventHistory(): Promise<ClearHistoryResponse> {
    return HttpClient.post<ClearHistoryResponse>(
      VehicleTestApiConfig.getClearHistoryUrl()
    )
  }

  /**
   * 6. 获取系统状态
   */
  static async getSystemStatus(): Promise<StatusResponse> {
    return HttpClient.get<StatusResponse>(
      VehicleTestApiConfig.getStatusUrl()
    )
  }

  /**
   * 7. 健康检查
   */
  static async checkHealth(): Promise<HealthResponse> {
    return HttpClient.get<HealthResponse>(
      VehicleTestApiConfig.getHealthUrl()
    )
  }

  // 便捷方法：批量触发事件

  /**
   * 车辆进入路段（上行）
   */
  static async vehicleEnterUpstream(segmentId: number, licensePlate?: string): Promise<VehicleEventResponse> {
    return this.triggerVehicleEvent(segmentId, 'upstream', 'enter', licensePlate)
  }

  /**
   * 车辆离开路段（上行）
   */
  static async vehicleExitUpstream(segmentId: number, licensePlate?: string): Promise<VehicleEventResponse> {
    return this.triggerVehicleEvent(segmentId, 'upstream', 'exit', licensePlate)
  }

  /**
   * 车辆进入路段（下行）
   */
  static async vehicleEnterDownstream(segmentId: number, licensePlate?: string): Promise<VehicleEventResponse> {
    return this.triggerVehicleEvent(segmentId, 'downstream', 'enter', licensePlate)
  }

  /**
   * 车辆离开路段（下行）
   */
  static async vehicleExitDownstream(segmentId: number, licensePlate?: string): Promise<VehicleEventResponse> {
    return this.triggerVehicleEvent(segmentId, 'downstream', 'exit', licensePlate)
  }

  /**
   * 设置红灯强控
   */
  static async setRedLight(segmentId: number): Promise<ControlEventResponse> {
    return this.triggerControlEvent(segmentId, 'RED')
  }

  /**
   * 设置黄闪
   */
  static async setYellowFlash(segmentId: number): Promise<ControlEventResponse> {
    return this.triggerControlEvent(segmentId, 'YF')
  }

  /**
   * 设置上行绿灯
   */
  static async setUpstreamGreen(segmentId: number): Promise<ControlEventResponse> {
    return this.triggerControlEvent(segmentId, 'UP')
  }

  /**
   * 设置下行绿灯
   */
  static async setDownstreamGreen(segmentId: number): Promise<ControlEventResponse> {
    return this.triggerControlEvent(segmentId, 'DOWN')
  }
}

// 导出默认实例
export default VehicleTestApiService

// 错误处理辅助函数
export class VehicleTestApiError extends Error {
  constructor(
    message: string,
    public readonly apiUrl?: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'VehicleTestApiError'
  }
}

// API状态检查工具
export class ApiHealthChecker {
  private static checkInterval: NodeJS.Timeout | null = null
  private static healthStatus: boolean = false
  private static callbacks: Set<(isHealthy: boolean) => void> = new Set()

  /**
   * 开始定期健康检查
   * @param intervalMs 检查间隔（毫秒）
   */
  static startHealthCheck(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.performHealthCheck() // 立即执行一次

    this.checkInterval = setInterval(() => {
      this.performHealthCheck()
    }, intervalMs)

    console.log(`🏥 API健康检查已启动，间隔: ${intervalMs}ms`)
  }

  /**
   * 停止健康检查
   */
  static stopHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('🏥 API健康检查已停止')
    }
  }

  /**
   * 订阅健康状态变化
   */
  static onHealthChange(callback: (isHealthy: boolean) => void): () => void {
    this.callbacks.add(callback)

    // 返回取消订阅的函数
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * 获取当前健康状态
   */
  static isHealthy(): boolean {
    return this.healthStatus
  }

  /**
   * 执行健康检查
   */
  private static async performHealthCheck(): Promise<void> {
    try {
      const health = await VehicleTestApiService.checkHealth()
      const isHealthy = health.status === 'UP'

      if (isHealthy !== this.healthStatus) {
        this.healthStatus = isHealthy
        console.log(`🏥 API健康状态变化: ${isHealthy ? '健康' : '异常'}`)

        // 通知所有订阅者
        this.callbacks.forEach(callback => {
          try {
            callback(isHealthy)
          } catch (error) {
            console.error('健康状态回调执行失败:', error)
          }
        })
      }
    } catch (error) {
      if (this.healthStatus !== false) {
        this.healthStatus = false
        console.error('🏥 API健康检查失败:', error)

        this.callbacks.forEach(callback => {
          try {
            callback(false)
          } catch (callbackError) {
            console.error('健康状态回调执行失败:', callbackError)
          }
        })
      }
    }
  }
}
