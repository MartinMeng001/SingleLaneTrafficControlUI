<template>
  <div class="configuration-view">
    <!-- 头部区域 -->
    <div class="view-header">
      <h1 class="view-title">系统参数配置</h1>
      <div class="header-actions">
        <button @click="refreshConfig" class="refresh-btn" :disabled="isLoading">
          <span class="btn-icon" :class="{ spinning: isLoading }">🔄</span>
          刷新配置
        </button>
        <button @click="checkHealth" class="health-btn">
          <span class="btn-icon">❤️</span>
          健康检查
        </button>
      </div>
    </div>

    <!-- 全局配置部分 -->
    <div class="config-section">
      <div class="section-header">
        <h2 class="section-title">全局配置</h2>
        <button
          @click="editGlobalConfig"
          class="edit-btn"
          :disabled="isLoading"
        >
          <span class="btn-icon">✏️</span>
          编辑
        </button>
      </div>

      <div class="global-config-card">
        <div class="config-grid">
          <div class="config-item">
            <label class="config-label">全红时间 (秒)</label>
            <div class="config-value">{{ globalConfig.allRed }}</div>
            <div class="config-description">系统默认的全红灯时间</div>
          </div>
          <div class="config-item">
            <label class="config-label">最大全红时间 (秒)</label>
            <div class="config-value">{{ globalConfig.maxAllRed }}</div>
            <div class="config-description">允许的最大全红灯时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 路段配置部分 -->
    <div class="config-section">
      <div class="section-header">
        <h2 class="section-title">路段配置</h2>
        <div class="section-actions">
          <button @click="handleAddSegment" class="add-btn">
            <span class="btn-icon">➕</span>
            添加路段
          </button>
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索路段..."
              class="search-input"
            />
          </div>
        </div>
      </div>

      <div class="segments-container">
        <div class="segments-header">
          <div class="header-cell">路段名称</div>
<!--          <div class="header-cell">信号灯ID</div>-->
          <div class="header-cell">全红时间</div>
          <div class="header-cell">上行控制</div>
          <div class="header-cell">下行控制</div>
          <div class="header-cell">进入区</div>
          <div class="header-cell">离开区</div>
          <div class="header-cell">操作</div>
        </div>

        <div class="segments-list">
          <div
            v-for="segment in filteredSegments"
            :key="segment.sigid"
            class="segment-row"
            :class="{ 'editing': currentEditingSegment?.sigid === segment.sigid }"
          >
            <div class="segment-cell">{{ segment.name }}</div>
<!--            <div class="segment-cell">{{ segment.sigid }}</div>-->
            <div class="segment-cell">{{ segment.allred }}</div>
            <div class="segment-cell">{{ CONTROL_PHASE_MAP[segment.upctrl] || '?' }}</div>
            <div class="segment-cell">{{ CONTROL_PHASE_MAP[segment.downctrl] || '?' }}</div>
            <div class="segment-cell">{{ globalConfig.regionNames?.[segment.inzone] || '?' }}</div>
            <div class="segment-cell">{{ globalConfig.regionNames?.[segment.outzone] || '?' }}</div>
            <div class="segment-cell actions">
              <button
                @click="handleEditSegment(segment)"
                class="action-btn edit"
                title="编辑"
                :disabled="isLoading"
              >
                ✏️
              </button>
              <button
                @click="handleDeleteSegment(segment.sigid)"
                class="action-btn delete"
                title="删除"
                :disabled="true"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredSegments.length === 0" class="no-segments">
          {{ searchQuery ? '没有找到匹配的路段' : '暂无路段配置' }}
        </div>
      </div>
    </div>

    <!-- 路段配置弹窗组件 -->
    <SegmentModal
      v-model:visible="showSegmentModal"
      :segment="currentEditingSegment"
      :globalConfig="globalConfig"
      :existing-segments="segments"
      :loading="isSaving"
      @submit="handleSegmentSubmit"
      @close="handleSegmentModalClose"
    />

    <!-- 全局配置编辑弹窗 -->
    <div v-if="showGlobalModal" class="modal-overlay" @click="closeGlobalModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑全局配置</h3>
          <button @click="closeGlobalModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">全红时间 (秒)</label>
            <input
              v-model.number="editingGlobal.allRed"
              type="number"
              min="30"
              max="600"
              class="form-input"
              :class="{ 'error': globalErrors.allRed }"
            />
            <div v-if="globalErrors.allRed" class="error-message">
              {{ globalErrors.allRed }}
            </div>
            <div class="form-hint">取值范围: 30-600秒</div>
          </div>
          <div class="form-group">
            <label class="form-label">最大全红时间 (秒)</label>
            <input
              v-model.number="editingGlobal.maxAllRed"
              type="number"
              min="60"
              max="1200"
              class="form-input"
              :class="{ 'error': globalErrors.maxAllRed }"
            />
            <div v-if="globalErrors.maxAllRed" class="error-message">
              {{ globalErrors.maxAllRed }}
            </div>
            <div class="form-hint">取值范围: 60-1200秒，必须大于等于全红时间</div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeGlobalModal" class="btn btn-secondary">取消</button>
          <button @click="saveGlobalConfig" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 健康检查结果弹窗 -->
    <div v-if="showHealthModal" class="modal-overlay" @click="closeHealthModal">
      <div class="modal-content health-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">系统健康检查</h3>
          <button @click="closeHealthModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="health-status" :class="healthStatus.overallStatus.toLowerCase()">
            <div class="status-icon">
              {{ healthStatus.overallStatus === 'UP' ? '✅' : '❌' }}
            </div>
            <div class="status-text">
              {{ healthStatus.overallStatus === 'UP' ? '系统运行正常' : '系统异常' }}
            </div>
          </div>

          <div class="health-details">
            <div class="health-item">
              <h4>配置服务</h4>
              <div class="health-value" :class="{ 'healthy': healthStatus.configService?.healthy }">
                {{ healthStatus.configService?.status || '未知' }}
              </div>
            </div>
            <div class="health-item">
              <h4>配置文件</h4>
              <div class="health-value" :class="{ 'healthy': healthStatus.configFile?.healthy }">
                {{ healthStatus.configFile?.status || '未知' }}
              </div>
            </div>
            <div class="health-item">
              <h4>内存使用</h4>
              <div class="health-value">
                {{ healthStatus.systemResources?.memory?.usagePercent || '未知' }}
              </div>
            </div>
            <div class="health-item">
              <h4>磁盘使用</h4>
              <div class="health-value">
                {{ healthStatus.systemResources?.disk?.usagePercent || '未知' }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeHealthModal" class="btn btn-primary">关闭</button>
        </div>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" class="message-toast" :class="messageType">
      <span class="message-icon">
        {{ messageType === 'success' ? '✅' : messageType === 'error' ? '❌' : 'ℹ️' }}
      </span>
      <span class="message-text">{{ message }}</span>
      <button @click="clearMessage" class="message-close">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { configApiService, type GlobalConfig, type SegmentConfig, type HealthStatus } from '@/api/config'
import { CONTROL_PHASE_MAP } from '@/utils/constants.ts'
import SegmentModal from '@/components/config/SegmentModal.vue'

// 响应式数据
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// 全局配置
const globalConfig = ref<GlobalConfig>({
  allRed: 120,
  maxAllRed: 300,
  regionNames: ['入口', '路段1', '路段2', '路段3', '路段4', '出口']
})

const editingGlobal = ref<GlobalConfig>({
  allRed: 120,
  maxAllRed: 300
})

const showGlobalModal = ref(false)
const globalErrors = ref<Record<string, string>>({})

// 路段配置
const segments = ref<SegmentConfig[]>([])
const searchQuery = ref('')
const showSegmentModal = ref(false)
const currentEditingSegment = ref<SegmentConfig | null>(null)

// 健康检查
const showHealthModal = ref(false)
const healthStatus = ref<HealthStatus>({
  overallStatus: 'UNKNOWN'
})

// 计算属性
const filteredSegments = computed(() => {
  if (!searchQuery.value) return segments.value

  const query = searchQuery.value.toLowerCase()
  return segments.value.filter(segment =>
    segment.name.toLowerCase().includes(query) ||
    segment.sigid.includes(query)
  )
})

// 加载配置数据
const loadConfigs = async () => {
  isLoading.value = true
  try {
    // 加载全局配置
    const globalData = await configApiService.global.getGlobalConfig()
    globalConfig.value = globalData

    // 加载路段配置
    const segmentsData = await configApiService.segment.getAllSegments()
    segments.value = segmentsData

    showMessage('配置加载成功', 'success')
  } catch (error: any) {
    showMessage(`加载配置失败: ${error.message || error}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 刷新配置
const refreshConfig = async () => {
  try {
    await configApiService.system.refreshConfig()
    await loadConfigs()
    showMessage('配置刷新成功', 'success')
  } catch (error: any) {
    showMessage(`配置刷新失败: ${error.message || error}`, 'error')
  }
}

// 健康检查
const checkHealth = async () => {
  try {
    const healthData = await configApiService.system.detailedHealthCheck()
    healthStatus.value = healthData.data || { overallStatus: 'UNKNOWN' }
    showHealthModal.value = true
  } catch (error: any) {
    showMessage(`健康检查失败: ${error.message || error}`, 'error')
  }
}

// 全局配置相关
const editGlobalConfig = () => {
  editingGlobal.value = { ...globalConfig.value }
  globalErrors.value = {}
  showGlobalModal.value = true
}

const validateGlobalConfig = (): boolean => {
  globalErrors.value = {}

  if (editingGlobal.value.allRed < 30 || editingGlobal.value.allRed > 600) {
    globalErrors.value.allRed = '全红时间必须在30-600秒之间'
  }

  if (editingGlobal.value.maxAllRed < 60 || editingGlobal.value.maxAllRed > 1200) {
    globalErrors.value.maxAllRed = '最大全红时间必须在60-1200秒之间'
  }

  if (editingGlobal.value.allRed > editingGlobal.value.maxAllRed) {
    globalErrors.value.maxAllRed = '最大全红时间必须大于等于全红时间'
  }

  return Object.keys(globalErrors.value).length === 0
}

const saveGlobalConfig = async () => {
  if (!validateGlobalConfig()) return

  isSaving.value = true
  try {
    await configApiService.global.updateGlobalConfig(editingGlobal.value)
    globalConfig.value = { ...editingGlobal.value }
    showGlobalModal.value = false
    showMessage('全局配置保存成功', 'success')
  } catch (error: any) {
    showMessage(`保存失败: ${error.message || error}`, 'error')
  } finally {
    isSaving.value = false
  }
}

const closeGlobalModal = () => {
  showGlobalModal.value = false
  globalErrors.value = {}
}

// 路段配置相关
const handleAddSegment = () => {
  currentEditingSegment.value = null
  showSegmentModal.value = true
}

const handleEditSegment = (segment: SegmentConfig) => {
  currentEditingSegment.value = { ...segment }
  showSegmentModal.value = true
}

const handleSegmentSubmit = async (segmentData: SegmentConfig) => {
  isSaving.value = true
  try {
    if (currentEditingSegment.value) {
      // 编辑模式
      await configApiService.segment.updateSegment(segmentData.sigid, segmentData)
      const index = segments.value.findIndex(s => s.sigid === segmentData.sigid)
      if (index !== -1) {
        segments.value[index] = { ...segmentData }
      }
      showMessage('路段更新成功', 'success')
    } else {
      // 添加模式
      await configApiService.segment.createSegment(segmentData)
      segments.value.push({ ...segmentData })
      showMessage('路段添加成功', 'success')
    }
    showSegmentModal.value = false
    currentEditingSegment.value = null
  } catch (error: any) {
    showMessage(`保存失败: ${error.message || error}`, 'error')
  } finally {
    isSaving.value = false
  }
}

const handleSegmentModalClose = () => {
  showSegmentModal.value = false
  currentEditingSegment.value = null
}

const handleDeleteSegment = async (sigid: string) => {
  const segment = segments.value.find(s => s.sigid === sigid)
  if (!segment) return

  if (!confirm(`确认删除路段"${segment.name}"吗？此操作不可撤销。`)) return

  try {
    await configApiService.segment.deleteSegment(sigid)
    segments.value = segments.value.filter(s => s.sigid !== sigid)
    showMessage('路段删除成功', 'success')
  } catch (error: any) {
    showMessage(`删除失败: ${error.message || error}`, 'error')
  }
}

// 健康检查弹窗
const closeHealthModal = () => {
  showHealthModal.value = false
}

// 消息提示
const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
  message.value = text
  messageType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    clearMessage()
  }, 3000)
}

const clearMessage = () => {
  message.value = ''
}

// 组件挂载时加载数据
onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.configuration-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  min-height: 600px;
}

/* 头部样式 */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-title {
  color: #667eea;
  margin: 0;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-btn, .health-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.refresh-btn {
  background: #667eea;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.health-btn {
  background: #28a745;
  color: white;
}

.health-btn:hover {
  background: #218838;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 配置部分样式 */
.config-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  color: #495057;
  margin: 0;
  font-size: 1.5rem;
}

.section-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.edit-btn, .add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.edit-btn:hover:not(:disabled), .add-btn:hover {
  background: #218838;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  width: 200px;
}

/* 全局配置卡片 */
.global-config-card {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.config-item {
  text-align: center;
}

.config-label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.config-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.config-description {
  font-size: 0.9rem;
  color: #6c757d;
}

/* 路段配置表格 */
.segments-container {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.segments-header {
  display: grid;
  grid-template-columns: 1fr 100px 80px 80px 80px 80px 80px 120px;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.header-cell {
  padding: 1rem 0.5rem;
  font-weight: 600;
  color: #495057;
  text-align: center;
  border-right: 1px solid #dee2e6;
}

.header-cell:last-child {
  border-right: none;
}

.segments-list {
  max-height: 400px;
  overflow-y: auto;
}

.segment-row {
  display: grid;
  grid-template-columns: 1fr 100px 80px 80px 80px 80px 80px 120px;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
}

.segment-row:hover {
  background: #f8f9fa;
}

.segment-row.editing {
  background: #e3f2fd;
}

.segment-cell {
  padding: 1rem 0.5rem;
  text-align: center;
  border-right: 1px solid #f1f3f4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.segment-cell:last-child {
  border-right: none;
}

.segment-cell.actions {
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  font-size: 1rem;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.action-btn.edit:hover {
  background: rgba(40, 167, 69, 0.1);
}

.action-btn.delete:hover {
  background: rgba(220, 53, 69, 0.1);
}

.no-segments {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

.modal-content.health-modal {
  max-width: 500px;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.modal-title {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
  max-height: 50vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f8f9fa;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

.form-input, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-input.error, .form-select.error {
  border-color: #dc3545;
}

.form-hint {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #6c757d;
}

.error-message {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #dc3545;
}

/* 按钮样式 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd8;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 健康检查样式 */
.health-status {
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.health-status.up {
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.health-status.down {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.status-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.status-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #495057;
}

.health-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.health-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.health-item h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 0.9rem;
}

.health-value {
  font-weight: 600;
  color: #dc3545;
}

.health-value.healthy {
  color: #28a745;
}

/* 加载指示器 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  border-radius: 12px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #495057;
  font-weight: 500;
}

/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1001;
  animation: slideInRight 0.3s ease-out;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-toast.success {
  background: #28a745;
}

.message-toast.error {
  background: #dc3545;
}

.message-toast.info {
  background: #17a2b8;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.message-icon {
  font-size: 1.2rem;
}

.message-text {
  flex: 1;
}

.message-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.message-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .segments-header,
  .segment-row {
    grid-template-columns: 1fr 90px 70px 70px 70px 70px 70px 100px;
  }
}

@media (max-width: 1024px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
  }

  .view-title {
    text-align: center;
    font-size: 1.5rem;
  }

  .header-actions {
    justify-content: center;
  }

  .segments-header,
  .segment-row {
    grid-template-columns: 1fr 80px 60px 60px 60px 60px 60px 90px;
    font-size: 0.9rem;
  }

  .segment-cell {
    padding: 0.75rem 0.25rem;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .configuration-view {
    padding: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    justify-content: space-between;
  }

  .search-input {
    width: 150px;
  }

  .segments-container {
    overflow-x: auto;
  }

  .segments-header,
  .segment-row {
    min-width: 600px;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .health-details {
    grid-template-columns: 1fr;
  }

  .message-toast {
    right: 10px;
    left: 10px;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-input {
    width: 100%;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
