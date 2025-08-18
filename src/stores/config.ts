// src/stores/config.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configApiService, type GlobalConfig, type SegmentConfig, type HealthStatus } from '@/api/config'

export const useConfigStore = defineStore('config', () => {
  // 状态数据
  const globalConfig = ref<GlobalConfig>({
    allRed: 120,
    maxAllRed: 300,
    regionNames: ['入口', '路段1', '路段2', '路段3', '路段4', '出口']
  })

  const segments = ref<SegmentConfig[]>([])
  const healthStatus = ref<HealthStatus>({
    overallStatus: 'UNKNOWN'
  })

  const isLoading = ref(false)
  const lastUpdateTime = ref(new Date())
  const isConnected = ref(true)

  // 计算属性
  const segmentCount = computed(() => segments.value.length)

  const segmentsByName = computed(() => {
    const map = new Map<string, SegmentConfig>()
    segments.value.forEach(segment => {
      map.set(segment.name, segment)
    })
    return map
  })

  const segmentsBySigid = computed(() => {
    const map = new Map<string, SegmentConfig>()
    segments.value.forEach(segment => {
      map.set(segment.sigid, segment)
    })
    return map
  })

  const isSystemHealthy = computed(() => {
    return healthStatus.value.overallStatus === 'UP'
  })

  // 统计信息
  const configStats = computed(() => ({
    totalSegments: segments.value.length,
    avgAllRedTime: segments.value.length > 0
      ? Math.round(segments.value.reduce((sum, s) => sum + s.allred, 0) / segments.value.length)
      : 0,
    uniqueControlPhases: new Set([
      ...segments.value.map(s => s.upctrl),
      ...segments.value.map(s => s.downctrl)
    ]).size,
    zoneRange: {
      minInZone: Math.min(...segments.value.map(s => s.inzone), Infinity),
      maxInZone: Math.max(...segments.value.map(s => s.inzone), 0),
      minOutZone: Math.min(...segments.value.map(s => s.outzone), Infinity),
      maxOutZone: Math.max(...segments.value.map(s => s.outzone), 0)
    }
  }))

  // 动作方法
  const loadGlobalConfig = async () => {
    try {
      isLoading.value = true
      const config = await configApiService.global.getGlobalConfig()
      globalConfig.value = config
      lastUpdateTime.value = new Date()
      isConnected.value = true
      return config
    } catch (error) {
      console.error('加载全局配置失败:', error)
      isConnected.value = false
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateGlobalConfig = async (config: GlobalConfig) => {
    try {
      isLoading.value = true
      await configApiService.global.updateGlobalConfig(config)
      globalConfig.value = { ...config }
      lastUpdateTime.value = new Date()
      return true
    } catch (error) {
      console.error('更新全局配置失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const loadSegments = async () => {
    try {
      isLoading.value = true
      const segmentList = await configApiService.segment.getAllSegments()
      segments.value = segmentList
      lastUpdateTime.value = new Date()
      isConnected.value = true
      return segmentList
    } catch (error) {
      console.error('加载路段配置失败:', error)
      isConnected.value = false
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const addSegment = async (segment: SegmentConfig) => {
    try {
      isLoading.value = true
      await configApiService.segment.createSegment(segment)
      segments.value.push({ ...segment })
      lastUpdateTime.value = new Date()
      return true
    } catch (error) {
      console.error('添加路段失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateSegment = async (sigid: string, segment: SegmentConfig) => {
    try {
      isLoading.value = true
      await configApiService.segment.updateSegment(sigid, segment)

      const index = segments.value.findIndex(s => s.sigid === sigid)
      if (index !== -1) {
        segments.value[index] = { ...segment }
      }

      lastUpdateTime.value = new Date()
      return true
    } catch (error) {
      console.error('更新路段失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const deleteSegment = async (sigid: string) => {
    try {
      isLoading.value = true
      await configApiService.segment.deleteSegment(sigid)

      segments.value = segments.value.filter(s => s.sigid !== sigid)
      lastUpdateTime.value = new Date()
      return true
    } catch (error) {
      console.error('删除路段失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const getSegmentById = (sigid: string): SegmentConfig | undefined => {
    return segmentsBySigid.value.get(sigid)
  }

  const getSegmentByName = (name: string): SegmentConfig | undefined => {
    return segmentsByName.value.get(name)
  }

  const refreshConfig = async () => {
    try {
      isLoading.value = true
      await configApiService.system.refreshConfig()

      // 重新加载所有配置
      await Promise.all([
        loadGlobalConfig(),
        loadSegments()
      ])

      return true
    } catch (error) {
      console.error('刷新配置失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const checkHealth = async () => {
    try {
      const response = await configApiService.system.detailedHealthCheck()
      healthStatus.value = response.data || { overallStatus: 'UNKNOWN' }
      isConnected.value = response.data?.overallStatus === 'UP'
      return healthStatus.value
    } catch (error) {
      console.error('健康检查失败:', error)
      healthStatus.value = { overallStatus: 'DOWN' }
      isConnected.value = false
      throw error
    }
  }

  const loadFullConfig = async () => {
    try {
      isLoading.value = true
      const fullConfig = await configApiService.system.getFullConfig()

      globalConfig.value = fullConfig.global
      segments.value = fullConfig.segments.segmentList || []
      lastUpdateTime.value = new Date()
      isConnected.value = true

      return fullConfig
    } catch (error) {
      console.error('加载完整配置失败:', error)
      isConnected.value = false
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 数据验证方法
  const validateGlobalConfig = (config: GlobalConfig): string[] => {
    const errors: string[] = []

    if (config.allRed < 30 || config.allRed > 600) {
      errors.push('全红时间必须在30-600秒之间')
    }

    if (config.maxAllRed < 60 || config.maxAllRed > 1200) {
      errors.push('最大全红时间必须在60-1200秒之间')
    }

    if (config.allRed > config.maxAllRed) {
      errors.push('最大全红时间必须大于等于全红时间')
    }

    return errors
  }

  const validateSegment = (segment: SegmentConfig, isNew = false): string[] => {
    const errors: string[] = []

    if (!segment.name || segment.name.length < 2 || segment.name.length > 50) {
      errors.push('路段名称长度必须在2-50个字符之间')
    }

    if (!/^\d{5}$/.test(segment.sigid)) {
      errors.push('信号灯ID必须是5位数字')
    }

    if (segment.allred < 10 || segment.allred > 300) {
      errors.push('全红时间必须在10-300秒之间')
    }

    if (segment.upctrl < 1 || segment.upctrl > 8) {
      errors.push('上行控制相位必须在1-8之间')
    }

    if (segment.downctrl < 1 || segment.downctrl > 8) {
      errors.push('下行控制相位必须在1-8之间')
    }

    if (segment.upctrl === segment.downctrl) {
      errors.push('上行和下行控制相位不能相同')
    }

    if (segment.inzone < 1 || segment.inzone > 10) {
      errors.push('进入区域必须在1-10之间')
    }

    if (segment.outzone < 1 || segment.outzone > 10) {
      errors.push('离开区域必须在1-10之间')
    }

    // 检查名称重复
    const existingByName = segments.value.find(s =>
      s.name === segment.name && s.sigid !== segment.sigid
    )
    if (existingByName) {
      errors.push('路段名称已存在')
    }

    // 检查信号灯ID重复（仅新增时）
    if (isNew) {
      const existingById = segments.value.find(s => s.sigid === segment.sigid)
      if (existingById) {
        errors.push('信号灯ID已存在')
      }
    }

    return errors
  }

  // 导出配置数据
  const exportConfig = () => {
    const configData = {
      global: globalConfig.value,
      segments: segments.value,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }

    const dataStr = JSON.stringify(configData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `traffic-config-${new Date().toISOString().split('T')[0]}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  // 重置为默认配置
  const resetToDefault = () => {
    globalConfig.value = {
      allRed: 120,
      maxAllRed: 300
    }

    segments.value = []
    healthStatus.value = { overallStatus: 'UNKNOWN' }
    lastUpdateTime.value = new Date()
  }

  // 数据搜索和过滤
  const searchSegments = (query: string): SegmentConfig[] => {
    if (!query) return segments.value

    const lowerQuery = query.toLowerCase()
    return segments.value.filter(segment =>
      segment.name.toLowerCase().includes(lowerQuery) ||
      segment.sigid.includes(query)
    )
  }

  const getSegmentsByZone = (zoneType: 'inzone' | 'outzone', zoneId: number): SegmentConfig[] => {
    return segments.value.filter(segment => segment[zoneType] === zoneId)
  }

  const getSegmentsByPhase = (phaseType: 'upctrl' | 'downctrl', phase: number): SegmentConfig[] => {
    return segments.value.filter(segment => segment[phaseType] === phase)
  }

  return {
    // 状态
    globalConfig,
    segments,
    healthStatus,
    isLoading,
    lastUpdateTime,
    isConnected,

    // 计算属性
    segmentCount,
    segmentsByName,
    segmentsBySigid,
    isSystemHealthy,
    configStats,

    // 方法
    loadGlobalConfig,
    updateGlobalConfig,
    loadSegments,
    addSegment,
    updateSegment,
    deleteSegment,
    getSegmentById,
    getSegmentByName,
    refreshConfig,
    checkHealth,
    loadFullConfig,
    validateGlobalConfig,
    validateSegment,
    exportConfig,
    resetToDefault,
    searchSegments,
    getSegmentsByZone,
    getSegmentsByPhase
  }
})
