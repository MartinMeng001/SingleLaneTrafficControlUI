import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LogEntryType, LogFilter } from '@/types/logs'

export const useLogsStore = defineStore('logs', () => {
  const logs = ref<LogEntryType[]>([
    {
      id: 1,
      timestamp: new Date('2024-12-19 14:30:15'),
      type: 'vehicle',
      level: 'info',
      message: '车辆 京A12345 进入路段0上行方向',
      vehicleId: '京A12345',
      segmentId: '0'
    },
    {
      id: 2,
      timestamp: new Date('2024-12-19 14:30:12'),
      type: 'segment',
      level: 'info',
      message: '路段1进入清空状态',
      segmentId: '1'
    },
    {
      id: 3,
      timestamp: new Date('2024-12-19 14:30:08'),
      type: 'vehicle',
      level: 'info',
      message: '车辆 京B67890 离开路段2下行方向',
      vehicleId: '京B67890',
      segmentId: '2'
    },
    {
      id: 4,
      timestamp: new Date('2024-12-19 14:30:05'),
      type: 'conflict',
      level: 'warning',
      message: '检测到路段2冲突：上下行同时有车',
      segmentId: '2'
    },
    {
      id: 5,
      timestamp: new Date('2024-12-19 14:29:58'),
      type: 'error',
      level: 'error',
      message: '检测器错误：车辆 京C11111 无源注册错误',
      vehicleId: '京C11111',
      details: {
        errorType: 'orphan_registration',
        description: '车辆在非入口路段首次出现'
      }
    }
  ])

  const filter = ref<LogFilter>({
    type: '',
    level: '',
    timeRange: '24',
    search: ''
  })

  // 计算属性 - 过滤后的日志
  const filteredLogs = computed(() => {
    let filtered = logs.value

    // 按类型过滤
    if (filter.value.type) {
      filtered = filtered.filter(log => log.type === filter.value.type)
    }

    // 按级别过滤
    if (filter.value.level) {
      filtered = filtered.filter(log => log.level === filter.value.level)
    }

    // 按时间过滤
    if (filter.value.timeRange !== 'all') {
      const hours = parseInt(filter.value.timeRange)
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
      filtered = filtered.filter(log => log.timestamp >= cutoff)
    }

    // 按搜索词过滤
    if (filter.value.search) {
      const search = filter.value.search.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(search) ||
        (log.vehicleId && log.vehicleId.toLowerCase().includes(search)) ||
        (log.segmentId && log.segmentId.includes(search))
      )
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  })

  // 统计信息
  const logStats = computed(() => ({
    total: logs.value.length,
    errors: logs.value.filter(log => log.level === 'error').length,
    warnings: logs.value.filter(log => log.level === 'warning').length,
    recent: logs.value.filter(log =>
      new Date().getTime() - log.timestamp.getTime() < 60 * 60 * 1000
    ).length
  }))

  // 动作
  const addLog = (logData: Omit<LogEntryType, 'id' | 'timestamp'>) => {
    const newLog: LogEntryType = {
      ...logData,
      id: logs.value.length + 1,
      timestamp: new Date()
    }
    logs.value.unshift(newLog)

    // 保持日志数量在合理范围内
    if (logs.value.length > 1000) {
      logs.value = logs.value.slice(0, 1000)
    }
  }

  const updateFilter = (newFilter: Partial<LogFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  const clearLogs = () => {
    logs.value = []
  }

  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `traffic-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    // 状态
    logs,
    filter,

    // 计算属性
    filteredLogs,
    logStats,

    // 动作
    addLog,
    updateFilter,
    clearLogs,
    exportLogs
  }
})
