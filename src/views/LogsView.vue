<template>
  <div class="logs-view">
    <!-- 头部信息 -->
    <div class="view-header">
      <h1 class="view-title">系统日志</h1>
      <div class="header-actions">
        <div class="log-stats">
          <span class="stat-item">
            总计: <strong>{{ statistics.totalCount || 0 }}</strong>
          </span>
          <span class="stat-item error">
            错误: <strong>{{ statistics.errorCount || 0 }}</strong>
          </span>
          <span class="stat-item warning">
            警告: <strong>{{ statistics.warnCount || 0 }}</strong>
          </span>
          <span class="stat-item today">
            今日: <strong>{{ statistics.todayCount || 0 }}</strong>
          </span>
        </div>
        <div class="header-buttons">
          <button @click="refreshLogs" class="refresh-btn" :disabled="isLoading">
            🔄 {{ isLoading ? '刷新中...' : '刷新' }}
          </button>
          <button @click="exportLogs" class="export-btn">
            📥 导出日志
          </button>
          <button @click="showCleanupDialog = true" class="cleanup-btn">
            🗑️ 清理
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">日志类型:</label>
          <select v-model="filters.logType" @change="applyFilters" class="filter-select">
            <option value="">全部</option>
            <option v-for="(label, type) in logTypes" :key="type" :value="type">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">日志级别:</label>
          <select v-model="filters.logLevel" @change="applyFilters" class="filter-select">
            <option value="">全部</option>
            <option v-for="(label, level) in logLevels" :key="level" :value="level">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">时间范围:</label>
          <select v-model="filters.timeRange" @change="applyFilters" class="filter-select">
            <option value="">全部</option>
            <option value="1h">最近1小时</option>
            <option value="6h">最近6小时</option>
            <option value="24h">最近24小时</option>
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">模块:</label>
          <input
            v-model="filters.module"
            @input="applyFilters"
            class="filter-input"
            placeholder="输入模块名称"
          >
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-group search-group">
          <label class="filter-label">搜索:</label>
          <input
            v-model="searchKeyword"
            @input="handleSearch"
            class="filter-input search-input"
            placeholder="搜索日志内容..."
          >
          <button @click="clearSearch" class="clear-search-btn" v-if="searchKeyword">
            ✕
          </button>
        </div>

        <div class="filter-group">
          <label class="filter-label">实体ID:</label>
          <input
            v-model="filters.entityId"
            @input="applyFilters"
            class="filter-input"
            placeholder="输入实体ID"
          >
        </div>

        <div class="filter-actions">
          <button @click="clearFilters" class="clear-filters-btn">
            清空筛选
          </button>
        </div>
      </div>
    </div>

    <!-- 日志列表 -->
    <div class="logs-container">
      <div class="logs-header">
        <div class="logs-info">
          <span class="logs-count">共 {{ totalElements }} 条日志</span>
          <span class="update-time" v-if="lastUpdateTime">
            最后更新: {{ formatTime(lastUpdateTime) }}
          </span>
        </div>
        <div class="view-controls">
          <label class="view-toggle">
            <input type="checkbox" v-model="showDetails">
            显示详情
          </label>
          <select v-model="pageSize" @change="loadLogs" class="page-size-select">
            <option value="20">每页 20 条</option>
            <option value="50">每页 50 条</option>
            <option value="100">每页 100 条</option>
          </select>
        </div>
      </div>

      <div class="logs-list" v-if="!isLoading && logs.length > 0">
        <div
          v-for="log in logs"
          :key="log.id"
          class="log-item"
          :class="[`level-${log.logLevel.toLowerCase()}`, { 'show-details': showDetails }]"
          @click="selectLog(log)"
        >
          <div class="log-main">
            <div class="log-header">
              <span class="log-time">{{ formatLogTime(log.createTime) }}</span>
              <span class="log-level" :class="`level-${log.logLevel.toLowerCase()}`">
                {{ getLogLevelLabel(log.logLevel) }}
              </span>
              <span class="log-type">{{ getLogTypeLabel(log.logType) }}</span>
              <span v-if="log.module" class="log-module">{{ log.module }}</span>
              <span v-if="log.entityId" class="log-entity">{{ log.entityId }}</span>
            </div>
            <div class="log-content">{{ log.logContent }}</div>
          </div>

          <div v-if="showDetails && (log.operator || log.extInfo)" class="log-details">
            <div v-if="log.operator" class="detail-item">
              <span class="detail-label">操作者:</span>
              <span class="detail-value">{{ log.operator }}</span>
            </div>
            <div v-if="log.extInfo" class="detail-item">
              <span class="detail-label">扩展信息:</span>
              <pre class="detail-value ext-info">{{ formatExtInfo(log.extInfo) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>正在加载日志...</span>
      </div>

      <!-- 空状态 -->
      <div v-if="!isLoading && logs.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>暂无日志数据</h3>
        <p>{{ hasFilters ? '当前筛选条件下没有找到日志' : '系统中暂无日志记录' }}</p>
        <button v-if="hasFilters" @click="clearFilters" class="clear-filters-btn">
          清空筛选条件
        </button>
      </div>

      <!-- 分页 -->
      <div v-if="!isLoading && totalPages > 1" class="pagination">
        <button
          @click="goToPage(0)"
          :disabled="currentPage === 0"
          class="page-btn"
        >
          首页
        </button>
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 0"
          class="page-btn"
        >
          上一页
        </button>

        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="['page-number', { active: page === currentPage }]"
          >
            {{ page + 1 }}
          </button>
        </div>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage >= totalPages - 1"
          class="page-btn"
        >
          下一页
        </button>
        <button
          @click="goToPage(totalPages - 1)"
          :disabled="currentPage >= totalPages - 1"
          class="page-btn"
        >
          末页
        </button>
      </div>
    </div>

    <!-- 日志详情弹窗 -->
    <div v-if="selectedLog" class="log-detail-modal" @click="closeLogDetail">
      <div class="log-detail-content" @click.stop>
        <div class="modal-header">
          <h3>日志详情</h3>
          <button @click="closeLogDetail" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span class="detail-value">{{ selectedLog.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">时间:</span>
            <span class="detail-value">{{ formatLogTime(selectedLog.createTime) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">类型:</span>
            <span class="detail-value">{{ getLogTypeLabel(selectedLog.logType) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">级别:</span>
            <span class="detail-value level-badge" :class="`level-${selectedLog.logLevel.toLowerCase()}`">
              {{ getLogLevelLabel(selectedLog.logLevel) }}
            </span>
          </div>
          <div v-if="selectedLog.module" class="detail-row">
            <span class="detail-label">模块:</span>
            <span class="detail-value">{{ selectedLog.module }}</span>
          </div>
          <div v-if="selectedLog.entityId" class="detail-row">
            <span class="detail-label">实体ID:</span>
            <span class="detail-value">{{ selectedLog.entityId }}</span>
          </div>
          <div v-if="selectedLog.operator" class="detail-row">
            <span class="detail-label">操作者:</span>
            <span class="detail-value">{{ selectedLog.operator }}</span>
          </div>
          <div class="detail-row full-width">
            <span class="detail-label">内容:</span>
            <div class="detail-value content-value">{{ selectedLog.logContent }}</div>
          </div>
          <div v-if="selectedLog.extInfo" class="detail-row full-width">
            <span class="detail-label">扩展信息:</span>
            <pre class="detail-value ext-info-value">{{ formatExtInfo(selectedLog.extInfo) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 清理确认弹窗 -->
    <div v-if="showCleanupDialog" class="cleanup-modal" @click="showCleanupDialog = false">
      <div class="cleanup-content" @click.stop>
        <h3>清理过期日志</h3>
        <div class="cleanup-form">
          <label>
            保留天数:
            <input type="number" v-model="cleanupDays" min="1" max="365">
          </label>
          <p class="cleanup-warning">
            将删除 {{ cleanupDays }} 天前的所有日志记录，此操作不可恢复！
          </p>
        </div>
        <div class="cleanup-actions">
          <button @click="showCleanupDialog = false" class="cancel-btn">取消</button>
          <button @click="confirmCleanup" class="confirm-btn" :disabled="isCleaningUp">
            {{ isCleaningUp ? '清理中...' : '确认清理' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  logApiService,
  type LogEntry,
  type LogQueryParams,
  type LogStatistics,
  type LogType,
  type LogLevel,
  getLogTypeLabel,
  getLogLevelLabel,
  formatLogTime,
  buildTimeRangeParams
} from '@/api/logs'

// ========== 响应式数据 ==========
const isLoading = ref(false)
const isCleaningUp = ref(false)
const logs = ref<LogEntry[]>([])
const statistics = ref<LogStatistics>({
  totalCount: 0,
  errorCount: 0,
  warnCount: 0,
  todayCount: 0,
  typeStatistics: {} as Record<LogType, number>,
  levelStatistics: {} as Record<LogLevel, number>,
  generateTime: ''
})

// 分页信息
const currentPage = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const lastUpdateTime = ref<Date | null>(null)

// 筛选条件
const filters = ref<LogQueryParams>({
  page: 0,
  size: 20,
  timeRange: '' // Initialize timeRange
})
const searchKeyword = ref('')
let searchTimeout: NodeJS.Timeout | null = null

// 日志类型和级别选项
const logTypes = ref<Partial<Record<LogType, string>>>({})
const logLevels = ref<Partial<Record<LogLevel, string>>>({})

// UI 状态
const showDetails = ref(false)
const selectedLog = ref<LogEntry | null>(null)
const showCleanupDialog = ref(false)
const cleanupDays = ref(30)

// ========== 计算属性 ==========
const hasFilters = computed(() => {
  return filters.value.logType ||
    filters.value.logLevel ||
    filters.value.startTime ||
    filters.value.module ||
    filters.value.entityId ||
    searchKeyword.value
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const range = 2
  const start = Math.max(0, current - range)
  const end = Math.min(total - 1, current + range)

  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// ========== 方法 ==========
const loadLogs = async () => {
  try {
    isLoading.value = true

    const queryParams: LogQueryParams = {
      ...filters.value,
      page: currentPage.value,
      size: pageSize.value
    }

    const response = await logApiService.getLogs(queryParams)

    if (response.success && response.data) {
      logs.value = response.data.content
      totalElements.value = response.data.totalElements
      totalPages.value = response.data.totalPages
      lastUpdateTime.value = new Date()
    }
  } catch (error) {
    console.error('加载日志失败:', error)
    // TODO: 显示错误提示
  } finally {
    isLoading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await logApiService.getLogStatistics()
    if (response.success && response.data) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const loadLogTypes = async () => {
  try {
    const response = await logApiService.getLogTypes()
    if (response.success && response.data) {
      logTypes.value = response.data
    }
  } catch (error) {
    console.error('加载日志类型失败:', error)
  }
}

const loadLogLevels = async () => {
  try {
    const response = await logApiService.getLogLevels()
    if (response.success && response.data) {
      logLevels.value = response.data
    }
  } catch (error) {
    console.error('加载日志级别失败:', error)
  }
}

const searchLogs = async (keyword: string) => {
  if (!keyword.trim()) {
    await loadLogs()
    return
  }

  try {
    isLoading.value = true
    const response = await logApiService.searchLogs({
      keyword: keyword.trim(),
      page: currentPage.value,
      size: pageSize.value
    })

    if (response.success && response.data) {
      logs.value = response.data.content
      totalElements.value = response.data.totalElements
      totalPages.value = response.data.totalPages
    }
  } catch (error) {
    console.error('搜索日志失败:', error)
  } finally {
    isLoading.value = false
  }
}

const applyFilters = async () => {
  currentPage.value = 0

  // 处理时间范围
  if (filters.value.timeRange) {
    const timeParams = buildTimeRangeParams(filters.value.timeRange)
    filters.value.startTime = timeParams.startTime
    filters.value.endTime = timeParams.endTime
  } else {
    delete filters.value.startTime
    delete filters.value.endTime
  }

  // 删除空值
  Object.keys(filters.value).forEach(key => {
    const value = filters.value[key as keyof LogQueryParams]
    if (!value || value === '') {
      delete filters.value[key as keyof LogQueryParams]
    }
  })

  if (searchKeyword.value) {
    await searchLogs(searchKeyword.value)
  } else {
    await loadLogs()
  }
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(async () => {
    currentPage.value = 0
    await searchLogs(searchKeyword.value)
  }, 500)
}

const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 0
  loadLogs()
}

const clearFilters = () => {
  filters.value = {
    page: 0,
    size: pageSize.value,
    timeRange: ''
  }
  searchKeyword.value = ''
  //timeRange.value = '' // Add this for Approach 2 or 3
  currentPage.value = 0
  loadLogs()
}

const refreshLogs = async () => {
  await Promise.all([
    loadLogs(),
    loadStatistics()
  ])
}

const goToPage = (page: number) => {
  currentPage.value = page
  if (searchKeyword.value) {
    searchLogs(searchKeyword.value)
  } else {
    loadLogs()
  }
}

const selectLog = (log: LogEntry) => {
  selectedLog.value = log
}

const closeLogDetail = () => {
  selectedLog.value = null
}

const exportLogs = () => {
  const data = logs.value.map(log => ({
    id: log.id,
    time: formatLogTime(log.createTime),
    type: getLogTypeLabel(log.logType),
    level: getLogLevelLabel(log.logLevel),
    content: log.logContent,
    module: log.module,
    entityId: log.entityId,
    operator: log.operator,
    extInfo: log.extInfo
  }))

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `traffic-logs-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const confirmCleanup = async () => {
  if (cleanupDays.value < 1 || cleanupDays.value > 365) {
    return
  }

  try {
    isCleaningUp.value = true
    const response = await logApiService.cleanupExpiredLogs(cleanupDays.value)

    if (response.success) {
      showCleanupDialog.value = false
      // TODO: 显示成功消息
      await refreshLogs()
    }
  } catch (error) {
    console.error('清理日志失败:', error)
    // TODO: 显示错误消息
  } finally {
    isCleaningUp.value = false
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

const formatExtInfo = (extInfo: string) => {
  try {
    const parsed = JSON.parse(extInfo)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return extInfo
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  await Promise.all([
    loadLogs(),
    loadStatistics(),
    loadLogTypes(),
    loadLogLevels()
  ])
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})

// 监听页面大小变化
watch(pageSize, () => {
  filters.value.size = pageSize.value
  currentPage.value = 0
  loadLogs()
})
</script>

<style scoped>
.logs-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  min-height: calc(100vh - 4rem);
}

/* 头部样式 */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-title {
  color: #667eea;
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.log-stats {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.stat-item {
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-item.error { color: #dc3545; }
.stat-item.warning { color: #ffc107; }
.stat-item.today { color: #28a745; }

.header-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.refresh-btn, .export-btn, .cleanup-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.refresh-btn {
  background: #007bff;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #0056b3;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-btn {
  background: #28a745;
  color: white;
}

.export-btn:hover {
  background: #218838;
}

.cleanup-btn {
  background: #dc3545;
  color: white;
}

.cleanup-btn:hover {
  background: #c82333;
}

/* 筛选器样式 */
.filter-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 120px;
}

.search-group {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.filter-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.filter-select, .filter-input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.filter-select:focus, .filter-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.search-input {
  padding-right: 2rem;
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  align-items: end;
}

.clear-filters-btn {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.clear-filters-btn:hover {
  background: #5a6268;
}

/* 日志容器样式 */
.logs-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  overflow: hidden;
}

.logs-header {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logs-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.logs-count {
  font-weight: 500;
  color: #333;
}

.update-time {
  color: #666;
  font-size: 0.85rem;
}

.view-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.page-size-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* 日志列表样式 */
.logs-list {
  max-height: 600px;
  overflow-y: auto;
}

.log-item {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f3f4;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.log-item:hover {
  background-color: #f8f9fa;
}

.log-item:last-child {
  border-bottom: none;
}

.log-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.log-time {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #666;
  min-width: 140px;
}

.log-level, .log-type {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.log-level.level-debug {
  background: #e9ecef;
  color: #6c757d;
}

.log-level.level-info {
  background: #cce5ff;
  color: #0066cc;
}

.log-level.level-warn {
  background: #fff3cd;
  color: #856404;
}

.log-level.level-error {
  background: #f8d7da;
  color: #721c24;
}

.log-type {
  background: #e7f3ff;
  color: #0056b3;
}

.log-module, .log-entity {
  font-size: 0.8rem;
  color: #666;
  background: #f1f3f4;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
}

.log-content {
  color: #333;
  line-height: 1.4;
  font-size: 0.95rem;
}

.log-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9ecef;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: flex-start;
}

.detail-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
  font-size: 0.85rem;
}

.detail-value {
  color: #333;
  font-size: 0.9rem;
}

.ext-info {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  border: 1px solid #e9ecef;
}
</style>
