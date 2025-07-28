import type { LogType, LogLevel, SegmentStatus, ZoneStatus } from '@/types'

export const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return `${seconds}秒前`
}

export const getLogTypeText = (type: LogType): string => {
  const typeMap = {
    vehicle: '车辆事件',
    segment: '路段状态',
    conflict: '冲突警告',
    error: '检测器错误',
    sensor: '传感器状态',
    system: '系统事件'
  }
  return typeMap[type] || type
}

export const getLogLevelText = (level: LogLevel): string => {
  const levelMap = {
    debug: '调试',
    info: '信息',
    warning: '警告',
    error: '错误'
  }
  return levelMap[level] || level
}

export const getSegmentStatusText = (status: SegmentStatus): string => {
  const statusMap = {
    empty: '清空',
    normal: '正常',
    warning: '警告',
    conflict: '冲突'
  }
  return statusMap[status] || status
}

export const getZoneStatusText = (status: ZoneStatus): string => {
  const statusMap = {
    empty: '空闲',
    occupied: '有车',
    full: '满载'
  }
  return statusMap[status] || status
}
