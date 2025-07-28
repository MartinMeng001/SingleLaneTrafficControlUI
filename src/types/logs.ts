export interface LogEntryType {
  id: number
  timestamp: Date
  type: LogType
  level: LogLevel
  message: string
  details?: Record<string, any>
  segmentId?: string
  vehicleId?: string
}

export type LogType =
  | 'vehicle'      // 车辆事件
  | 'segment'      // 路段状态
  | 'conflict'     // 冲突警告
  | 'error'        // 检测器错误
  | 'sensor'       // 传感器状态
  | 'system'       // 系统事件

export type LogLevel = 'info' | 'warning' | 'error' | 'debug'

export interface LogFilter {
  type: string
  level: string
  timeRange: string
  search: string
  segmentId?: string
}

export interface DetectorError {
  type: 'orphan_registration' | 'reverse_state' | 'invalid_transition' | 'duplicate_existence' | 'zombie_vehicle'
  vehicleId: string
  segmentId: string
  description: string
}
