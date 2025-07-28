import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Segment, MeetingZoneType, TrafficStatistics, VehicleEvent } from '@/types/monitoring'

export const useMonitoringStore = defineStore('monitoring', () => {
  // 状态数据
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

  // 动作
  const updateSegment = (segmentId: number, updates: Partial<Segment>) => {
    const index = segments.value.findIndex(s => s.id === segmentId)
    if (index !== -1) {
      segments.value[index] = { ...segments.value[index], ...updates }
      updateSegmentStatus(segmentId)
    }
  }

  const updateMeetingZone = (zoneId: number, updates: Partial<MeetingZoneType>) => {
    const index = meetingZones.value.findIndex(z => z.id === zoneId)
    if (index !== -1) {
      meetingZones.value[index] = { ...meetingZones.value[index], ...updates }
    }
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

      updateSegmentStatus(segmentId)
    }
  }

  return {
    // 状态
    segments,
    meetingZones,
    statistics,
    isConnected,
    lastUpdateTime,

    // 计算属性
    totalConflicts,
    systemHealth,

    // 动作
    updateSegment,
    updateMeetingZone,
    updateStatistics,
    processVehicleEvent
  }
})
