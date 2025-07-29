import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Segment, MeetingZoneType, TrafficStatistics, VehicleEvent } from '@/types/monitoring'

export const useMonitoringStore = defineStore('monitoring', () => {
  // 状态数据 - 现在包含4个路段和3个会车区
  const segments = ref<Segment[]>([
    {
      id: 0,
      name: '路段0',
      upstreamLight: 'green',
      downstreamLight: 'red',
      upstreamVehicles: true,
      downstreamVehicles: false,
      conflict: false,
      capacity: 5,
      currentCount: 2,
      status: 'normal'
    },
    {
      id: 1,
      name: '路段1',
      upstreamLight: 'red',
      downstreamLight: 'green',
      upstreamVehicles: false,
      downstreamVehicles: true,
      conflict: false,
      capacity: 5,
      currentCount: 1,
      status: 'normal'
    },
    {
      id: 2,
      name: '路段2',
      upstreamLight: 'green',
      downstreamLight: 'red',
      upstreamVehicles: true,
      downstreamVehicles: true,
      conflict: true,
      capacity: 5,
      currentCount: 4,
      status: 'conflict'
    },
    {
      id: 3,
      name: '路段3',
      upstreamLight: 'yellow',
      downstreamLight: 'yellow',
      upstreamVehicles: false,
      downstreamVehicles: false,
      conflict: false,
      capacity: 5,
      currentCount: 0,
      status: 'empty'
    }
  ])

  const meetingZones = ref<MeetingZoneType[]>([
    {
      id: 0,
      name: '会车区0',
      upstream: 'occupied',
      downstream: 'empty',
      full: false,
      capacity: 3,
      upstreamCount: 1,
      downstreamCount: 0
    },
    {
      id: 1,
      name: '会车区1',
      upstream: 'full',
      downstream: 'occupied',
      full: true,
      capacity: 3,
      upstreamCount: 3,
      downstreamCount: 2
    },
    {
      id: 2,
      name: '会车区2',
      upstream: 'empty',
      downstream: 'occupied',
      full: false,
      capacity: 4,
      upstreamCount: 0,
      downstreamCount: 1
    }
  ])

  const statistics = ref<TrafficStatistics>({
    totalVehicles: 12,
    conflictCount: 1,
    passedVehicles: 847,
    averageWaitTime: 35
  })

  const isConnected = ref(true)
  const lastUpdateTime = ref(new Date())

  // 新增：详细车辆信息存储
  const segmentVehicles = ref<Record<number, {
    upstreamVehicles: string[]
    downstreamVehicles: string[]
    upstreamCount: number
    downstreamCount: number
  }>>({
    0: {
      upstreamVehicles: ['京A12345', '京B67890'],
      downstreamVehicles: [],
      upstreamCount: 2,
      downstreamCount: 0
    },
    1: {
      upstreamVehicles: [],
      downstreamVehicles: ['京C11111'],
      upstreamCount: 0,
      downstreamCount: 1
    },
    2: {
      upstreamVehicles: ['京D22222', '京E33333'],
      downstreamVehicles: ['京F44444', '京G55555'],
      upstreamCount: 3, // 可能有未识别车牌的车辆
      downstreamCount: 2
    },
    3: {
      upstreamVehicles: [],
      downstreamVehicles: [],
      upstreamCount: 0,
      downstreamCount: 0
    }
  })

  // 计算属性
  const totalConflicts = computed(() => {
    return segments.value.filter(segment => segment.conflict).length
  })

  const systemHealth = computed(() => {
    const conflictRatio = totalConflicts.value / segments.value.length
    if (conflictRatio > 0.5) return 'critical'
    if (conflictRatio > 0.2) return 'warning'
    return 'healthy'
  })

  // 获取路段详细车辆信息
  const getSegmentVehicleDetails = (segmentId: number) => {
    return segmentVehicles.value[segmentId] || {
      upstreamVehicles: [],
      downstreamVehicles: [],
      upstreamCount: 0,
      downstreamCount: 0
    }
  }

  // 动作
  const updateSegment = (segmentId: number, updates: Partial<Segment>) => {
    const index = segments.value.findIndex(s => s.id === segmentId)
    if (index !== -1) {
      segments.value[index] = { ...segments.value[index], ...updates }
      updateSegmentStatus(segmentId)
      lastUpdateTime.value = new Date()
    }
  }

  const updateMeetingZone = (zoneId: number, updates: Partial<MeetingZoneType>) => {
    const index = meetingZones.value.findIndex(z => z.id === zoneId)
    if (index !== -1) {
      meetingZones.value[index] = { ...meetingZones.value[index], ...updates }
      lastUpdateTime.value = new Date()
    }
  }

  const updateSegmentVehicles = (segmentId: number, vehicleData: {
    upstreamVehicles?: string[]
    downstreamVehicles?: string[]
    upstreamCount?: number
    downstreamCount?: number
  }) => {
    if (!segmentVehicles.value[segmentId]) {
      segmentVehicles.value[segmentId] = {
        upstreamVehicles: [],
        downstreamVehicles: [],
        upstreamCount: 0,
        downstreamCount: 0
      }
    }

    Object.assign(segmentVehicles.value[segmentId], vehicleData)
    lastUpdateTime.value = new Date()
  }

  const updateSegmentStatus = (segmentId: number) => {
    const segment = segments.value.find(s => s.id === segmentId)
    if (!segment) return

    if (segment.conflict) {
      segment.status = 'conflict'
    } else if (!segment.upstreamVehicles && !segment.downstreamVehicles) {
      segment.status = 'empty'
    } else if (segment.currentCount >= segment.capacity * 0.8) {
      segment.status = 'warning'
    } else {
      segment.status = 'normal'
    }
  }

  const updateStatistics = (newStats: Partial<TrafficStatistics>) => {
    statistics.value = { ...statistics.value, ...newStats }
    lastUpdateTime.value = new Date()
  }

  const processVehicleEvent = (event: VehicleEvent) => {
    // 处理车辆事件逻辑
    lastUpdateTime.value = new Date()

    // 根据事件更新相关路段状态
    const segmentId = parseInt(event.segmentId)
    const segment = segments.value.find(s => s.id === segmentId)

    if (segment) {
      if (event.direction === 'upstream') {
        segment.upstreamVehicles = event.eventType === 'enter'
      } else {
        segment.downstreamVehicles = event.eventType === 'enter'
      }

      // 更新车辆详细信息
      const vehicleDetails = getSegmentVehicleDetails(segmentId)
      const vehicleList = event.direction === 'upstream'
        ? vehicleDetails.upstreamVehicles
        : vehicleDetails.downstreamVehicles

      if (event.eventType === 'enter') {
        if (!vehicleList.includes(event.vehicleId)) {
          vehicleList.push(event.vehicleId)
        }
      } else {
        const index = vehicleList.indexOf(event.vehicleId)
        if (index > -1) {
          vehicleList.splice(index, 1)
        }
      }

      updateSegmentStatus(segmentId)
    }
  }

  // 模拟控制操作
  const executeZoneControl = (zoneId: number, action: string) => {
    return new Promise<{ success: boolean, message: string }>((resolve) => {
      // 模拟网络延迟
      setTimeout(() => {
        const zone = meetingZones.value.find(z => z.id === zoneId)
        if (!zone) {
          resolve({ success: false, message: '会车区不存在' })
          return
        }

        // 模拟操作成功率（90%）
        const success = Math.random() > 0.1

        if (success) {
          // 根据操作类型更新会车区状态
          switch (action) {
            case 'release_upstream':
              // 实际应该调用信号控制系统
              resolve({ success: true, message: '上行放行指令已发送' })
              break
            case 'release_downstream':
              resolve({ success: true, message: '下行放行指令已发送' })
              break
            case 'prohibit_all':
              resolve({ success: true, message: '禁行指令已发送' })
              break
            case 'release_control':
              resolve({ success: true, message: '已恢复自动控制' })
              break
            default:
              resolve({ success: false, message: '未知操作类型' })
          }
        } else {
          resolve({ success: false, message: '操作执行失败，请重试' })
        }
      }, 1000 + Math.random() * 2000) // 1-3秒延迟
    })
  }

  return {
    // 状态
    segments,
    meetingZones,
    statistics,
    isConnected,
    lastUpdateTime,
    segmentVehicles,

    // 计算属性
    totalConflicts,
    systemHealth,

    // 动作
    updateSegment,
    updateMeetingZone,
    updateSegmentVehicles,
    updateStatistics,
    processVehicleEvent,
    getSegmentVehicleDetails,
    executeZoneControl
  }
})
