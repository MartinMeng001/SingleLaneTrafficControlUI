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

// 路段变量状态相关类型定义
export interface SegmentVariablesResponse {
  success: boolean
  message: string
  segmentId: number
  variables: {
    configParams: {
      minGreen: number
      maxGreen: number
      minRed: number
      maxRed: number
      roadLength: number
    }
    timeVariables: {
      greenStartTime: string | null
      redStartTime: string | null
      lastSwitchTime: string | null
      conservativeTimerStart: string | null
    }
    vehicleVariables: {
      upstreamVehicleIds: string[]
      downstreamVehicleIds: string[]
      upstreamInCounter: number
      upstreamOutCounter: number
      downstreamInCounter: number
      downstreamOutCounter: number
    }
    requestVariables: {
      upstreamRequest: boolean
      downstreamRequest: boolean
      upstreamRequestTime: string | null
      downstreamRequestTime: string | null
      forceSwitchReq: number
    }
    clearanceVariables: {
      upstreamClearanceDecision: 'WAIT' | 'CLEAR' | 'CONFLICT'
      downstreamClearanceDecision: 'WAIT' | 'CLEAR' | 'CONFLICT'
      overallClearanceDecision: 'WAIT' | 'CLEAR' | 'CONFLICT'
    }
    scheduleVariables: {
      lastServedDirection: 'UPSTREAM' | 'DOWNSTREAM' | 'NONE'
      upstreamWaitingTime: number
      downstreamWaitingTime: number
      priorityScoreUpstream: number
      priorityScoreDownstream: number
      priorityDirection: 'UPSTREAM' | 'DOWNSTREAM' | 'NONE'
    }
    errorVariables: {
      errorCountMismatch: number
      errorCountIdLogic: number
      consecutiveErrors: number
      segmentHealthScore: number
    }
    statusVariables: {
      faultDetected: boolean
      criticalSensorsNormal: boolean
      emptyUpstreamMeetingzone: boolean
      emptyDownstreamMeetingzone: boolean
    }
  }
  timestamp: string
}

// 系统变量状态相关类型定义
export interface SystemVariablesResponse {
  success: boolean
  message: string
  variables: {
    timeVariables: {
      allRedTime: number
      maxAllRedTime: number
      stateStartTime: string | null
      systemInitStartTime: string | null
      transitionStartTime: string | null
      lastFaultTime: string | null
      recoveryStartTime: string | null
      lastHealthUpdateTime: string | null
      lastClearanceCheckTime: string | null
    }
    statusVariables: {
      previousState: string | null
      faultSource: 'EXTERNAL' | 'SEGMENT' | 'SYSTEM' | null
      maintenanceType: string | null
      emergencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      clearDetectionActive: boolean
      autoRecoveryEnabled: boolean
    }
    segmentVariables: {
      segmentCount: number
      clearedSegmentCount: number
      segmentClearanceStates: {
        [key: string]: {
          segmentId: number
          overallDecision: 'WAIT' | 'CLEAR' | 'CONFLICT'
          readyForSwitch: boolean
          faultDetected: boolean
        }
      }
    }
    healthVariables: {
      systemHealthScore: number
      performanceDegradation: number
      lastStableConfig: {
        segmentCount: number
        controlMode: 'INDUCTIVE' | 'MANUAL' | 'MAINTENANCE'
      }
      communicationNormal: boolean
      powerStatusNormal: boolean
    }
    controlVariables: {
      currentControlMode: 'INDUCTIVE' | 'MANUAL' | 'MAINTENANCE'
      configurationLoaded: boolean
    }
    communicationVariables: {
      communicationStatus: 'NORMAL' | 'WARNING' | 'ERROR'
      powerStatus: 'NORMAL' | 'WARNING' | 'ERROR'
    }
    errorVariables: {
      idLogicErrorCount: number
      counterMismatchErrorCount: number
      recentErrorHistory: Array<{
        errorType: string
        description: string
        source: string
        timestamp: string
      }>
    }
  }
  timestamp: string
}

// 错误响应类型定义
export interface VariablesErrorResponse {
  success: false
  message: string
  segmentId?: number
  timestamp: string
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
  },

  /**
   * 获取路段变量状态接口
   * @param segmentId 路段ID，取值范围: 1-4
   * @returns 返回指定路段ID下SegmentVariables所有变量的当前状态
   */
  getSegmentVariables: async (segmentId: number): Promise<SegmentVariablesResponse> => {
    // 参数验证
    if (!Number.isInteger(segmentId) || segmentId < 1 || segmentId > 4) {
      throw new Error(`无效的路段ID: ${segmentId}，取值范围: 1-4`)
    }

    try {
      const response = await monitoringApi.get<SegmentVariablesResponse>(
        `/test/vehicle-events/segment/${segmentId}/variables`
      )
      return response.data
    } catch (error) {
      console.error(`获取路段${segmentId}变量状态失败:`, error)
      throw error
    }
  },

  /**
   * 获取系统变量状态接口
   * @returns 返回statemachinev3下SystemVariables所有变量的当前状态
   */
  getSystemVariables: async (): Promise<SystemVariablesResponse> => {
    try {
      const response = await monitoringApi.get<SystemVariablesResponse>(
        '/test/vehicle-events/system/variables'
      )
      return response.data
    } catch (error) {
      console.error('获取系统变量状态失败:', error)
      throw error
    }
  }
}

// 便捷方法类 - 提供更方便的调用方式
export class VariableStatusHelper {
  /**
   * 批量获取所有路段的变量状态
   * @param segmentIds 路段ID数组，默认为[1,2,3,4]
   * @returns Promise<SegmentVariablesResponse[]>
   */
  static async getAllSegmentVariables(
    segmentIds: number[] = [1, 2, 3, 4]
  ): Promise<SegmentVariablesResponse[]> {
    const promises = segmentIds.map(id => monitoringApiService.getSegmentVariables(id))

    try {
      const results = await Promise.allSettled(promises)
      return results
        .filter((result): result is PromiseFulfilledResult<SegmentVariablesResponse> =>
          result.status === 'fulfilled')
        .map(result => result.value)
    } catch (error) {
      console.error('批量获取路段变量状态失败:', error)
      throw error
    }
  }

  /**
   * 获取路段健康度统计
   * @param segmentIds 路段ID数组，默认为[1,2,3,4]
   * @returns 健康度统计信息
   */
  static async getSegmentHealthSummary(
    segmentIds: number[] = [1, 2, 3, 4]
  ): Promise<{
    totalSegments: number
    healthySegments: number
    averageHealthScore: number
    faultSegments: number[]
    lowHealthSegments: number[]
  }> {
    const segmentVariables = await this.getAllSegmentVariables(segmentIds)

    const faultSegments: number[] = []
    const lowHealthSegments: number[] = []
    let totalHealthScore = 0
    let healthyCount = 0

    segmentVariables.forEach(segment => {
      const healthScore = segment.variables.errorVariables.segmentHealthScore
      const hasFault = segment.variables.statusVariables.faultDetected

      totalHealthScore += healthScore

      if (hasFault) {
        faultSegments.push(segment.segmentId)
      } else if (healthScore >= 90) {
        healthyCount++
      } else if (healthScore < 70) {
        lowHealthSegments.push(segment.segmentId)
      }
    })

    return {
      totalSegments: segmentVariables.length,
      healthySegments: healthyCount,
      averageHealthScore: segmentVariables.length > 0 ? totalHealthScore / segmentVariables.length : 0,
      faultSegments,
      lowHealthSegments
    }
  }

  /**
   * 检查系统是否准备就绪
   * @returns 系统就绪状态信息
   */
  static async checkSystemReadiness(): Promise<{
    isReady: boolean
    systemHealthScore: number
    readySegments: number
    totalSegments: number
    issues: string[]
  }> {
    try {
      const systemVariables = await monitoringApiService.getSystemVariables()
      const issues: string[] = []

      const systemHealthScore = systemVariables.variables.healthVariables.systemHealthScore
      const readySegments = systemVariables.variables.segmentVariables.clearedSegmentCount
      const totalSegments = systemVariables.variables.segmentVariables.segmentCount

      // 检查各种系统状态
      if (!systemVariables.variables.healthVariables.communicationNormal) {
        issues.push('通信异常')
      }
      if (!systemVariables.variables.healthVariables.powerStatusNormal) {
        issues.push('电源状态异常')
      }
      if (!systemVariables.variables.controlVariables.configurationLoaded) {
        issues.push('配置未加载')
      }
      if (systemVariables.variables.communicationVariables.communicationStatus !== 'NORMAL') {
        issues.push(`通信状态: ${systemVariables.variables.communicationVariables.communicationStatus}`)
      }
      if (systemVariables.variables.communicationVariables.powerStatus !== 'NORMAL') {
        issues.push(`电源状态: ${systemVariables.variables.communicationVariables.powerStatus}`)
      }
      if (systemHealthScore < 80) {
        issues.push(`系统健康度过低: ${systemHealthScore.toFixed(1)}`)
      }

      const isReady = issues.length === 0 && readySegments === totalSegments

      return {
        isReady,
        systemHealthScore,
        readySegments,
        totalSegments,
        issues
      }
    } catch (error) {
      console.error('检查系统就绪状态失败:', error)
      throw error
    }
  }
}

// 默认导出
export default monitoringApiService
