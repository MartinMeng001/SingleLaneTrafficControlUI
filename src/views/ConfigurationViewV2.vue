const saveSegmentConfig = async () => {
if (!validateSegmentConfig()) return

isSaving.value = true
try {
// 使用upsigid作为路径参数，根据API文档要求
await newConfigApiService.updateSegmentConfig(editingSegment.value.upsigid, editingSegment.value)

// 更新本地数据
const index = segments.value.findIndex(s => s.segmentId === editingSegment.<template>
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
        <button @click="testConnection" class="test-btn">
          <span class="btn-icon">🔗</span>
          测试连接
        </button>
        <button @click="showConstraints" class="constraints-btn">
          <span class="btn-icon">📋</span>
          配置约束
        </button>
      </div>
    </div>

    <!-- 系统约束说明 -->
    <div class="constraints-notice">
      <div class="notice-icon">⚠️</div>
      <div class="notice-content">
        <strong>重要说明：</strong>
        <span>此系统严格限制配置操作：只能修改现有参数，不能增加或删除配置项。检测点配置完全只读。</span>
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
          编辑参数
        </button>
      </div>

      <div class="global-config-card">
        <div class="config-grid">
          <div class="config-item">
            <label class="config-label">全红时间 (秒)</label>
            <div class="config-value">{{ globalConfig.allRed }}</div>
            <div class="config-description">系统默认的全红灯时间 (1-600秒)</div>
          </div>
          <div class="config-item">
            <label class="config-label">最大全红时间 (秒)</label>
            <div class="config-value">{{ globalConfig.maxAllRed }}</div>
            <div class="config-description">允许的最大全红灯时间 (1-1200秒)</div>
          </div>
          <div class="config-item">
            <label class="config-label">平台地址</label>
            <div class="config-value readonly">{{ globalConfig.platformUrl }}</div>
            <div class="config-description readonly">只读参数</div>
          </div>
          <div class="config-item">
            <label class="config-label">信号控制器数量</label>
            <div class="config-value readonly">{{ globalConfig.signalControllerList?.length || 0 }}</div>
            <div class="config-description readonly">只读参数</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 路段配置部分 -->
    <div class="config-section">
      <div class="section-header">
        <h2 class="section-title">路段配置</h2>
        <div class="section-actions">
          <div class="readonly-notice">
            <span class="notice-icon">🔒</span>
            只允许修改现有路段参数
          </div>
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
          <div class="header-cell">长度(米)</div>
          <div class="header-cell">最小红灯</div>
          <div class="header-cell">最大红灯</div>
          <div class="header-cell">最小绿灯</div>
          <div class="header-cell">最大绿灯</div>
          <div class="header-cell">上行信号</div>
          <div class="header-cell">下行信号</div>
          <div class="header-cell">操作</div>
        </div>

        <div class="segments-list">
          <div
            v-for="segment in filteredSegments"
            :key="segment.segmentId"
            class="segment-row"
          >
            <div class="segment-cell">{{ segment.name }}</div>
            <div class="segment-cell">{{ segment.length }}</div>
            <div class="segment-cell">{{ segment.minRed }}s</div>
            <div class="segment-cell">{{ segment.maxRed }}s</div>
            <div class="segment-cell">{{ segment.minGreen }}s</div>
            <div class="segment-cell">{{ segment.maxGreen }}s</div>
            <div class="segment-cell readonly">{{ segment.upsigid }}</div>
            <div class="segment-cell">{{ segment.downsigid }}</div>
            <div class="segment-cell actions">
              <button
                @click="handleEditSegment(segment)"
                class="action-btn edit"
                title="编辑参数"
                :disabled="isLoading"
              >
                ✏️
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredSegments.length === 0" class="no-segments">
          {{ searchQuery ? '没有找到匹配的路段' : '暂无路段配置' }}
        </div>
      </div>
    </div>

    <!-- 等待区配置部分 -->
    <div class="config-section">
      <div class="section-header">
        <h2 class="section-title">等待区配置</h2>
        <div class="readonly-notice">
          <span class="notice-icon">🔒</span>
          只允许修改容量参数
        </div>
      </div>

      <div class="waiting-areas-container">
        <div class="waiting-areas-grid">
          <div
            v-for="area in waitingAreas"
            :key="area.index"
            class="waiting-area-card"
          >
            <div class="area-header">
              <h3>等待区 {{ area.index }}</h3>
              <button
                @click="handleEditWaitingArea(area)"
                class="action-btn edit"
                :disabled="isLoading"
              >
                ✏️
              </button>
            </div>
            <div class="area-content">
              <div class="capacity-item">
                <label>上行容量</label>
                <span class="capacity-value">{{ area.upCapacity }}</span>
              </div>
              <div class="capacity-item">
                <label>下行容量</label>
                <span class="capacity-value">{{ area.downCapacity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 检测点配置部分（只读） -->
    <div class="config-section">
      <div class="section-header">
        <h2 class="section-title">检测点配置</h2>
        <div class="readonly-notice readonly">
          <span class="notice-icon">👁️</span>
          完全只读，不允许修改
        </div>
      </div>

      <div class="detect-points-container">
        <div class="detect-points-list">
          <div
            v-for="point in detectPoints"
            :key="point.index"
            class="detect-point-item readonly"
          >
            <div class="point-index">{{ point.index }}</div>
            <div class="point-details">{{ point.details }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 路段配置编辑弹窗 -->
    <div v-if="showSegmentModal" class="modal-overlay" @click="closeSegmentModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑路段配置</h3>
          <button @click="closeSegmentModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">路段名称</label>
              <input
                v-model="editingSegment.name"
                type="text"
                class="form-input"
                :class="{ 'error': segmentErrors.name }"
              />
              <div v-if="segmentErrors.name" class="error-message">
                {{ segmentErrors.name }}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">路段长度 (米)</label>
              <input
                v-model.number="editingSegment.length"
                type="number"
                min="1"
                class="form-input"
                :class="{ 'error': segmentErrors.length }"
              />
              <div v-if="segmentErrors.length" class="error-message">
                {{ segmentErrors.length }}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">最小红灯时间 (秒)</label>
              <input
                v-model.number="editingSegment.minRed"
                type="number"
                min="1"
                class="form-input"
                :class="{ 'error': segmentErrors.minRed }"
              />
              <div v-if="segmentErrors.minRed" class="error-message">
                {{ segmentErrors.minRed }}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">最大红灯时间 (秒)</label>
              <input
                v-model.number="editingSegment.maxRed"
                type="number"
                min="1"
                class="form-input"
                :class="{ 'error': segmentErrors.maxRed }"
              />
              <div v-if="segmentErrors.maxRed" class="error-message">
                {{ segmentErrors.maxRed }}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">最小绿灯时间 (秒)</label>
              <input
                v-model.number="editingSegment.minGreen"
                type="number"
                min="1"
                class="form-input"
                :class="{ 'error': segmentErrors.minGreen }"
              />
              <div v-if="segmentErrors.minGreen" class="error-message">
                {{ segmentErrors.minGreen }}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">最大绿灯时间 (秒)</label>
              <input
                v-model.number="editingSegment.maxGreen"
                type="number"
                min="1"
                class="form-input"
                :class="{ 'error': segmentErrors.maxGreen }"
              />
              <div v-if="segmentErrors.maxGreen" class="error-message">
                {{ segmentErrors.maxGreen }}
              </div>
            </div>
            <div class="form-group readonly-field">
              <label class="form-label">上行信号ID (只读)</label>
              <input
                v-model="editingSegment.upsigid"
                type="text"
                class="form-input readonly"
                readonly
              />
              <div class="form-hint">此参数不允许修改</div>
            </div>
            <div class="form-group">
              <label class="form-label">下行信号ID</label>
              <input
                v-model="editingSegment.downsigid"
                type="text"
                class="form-input"
                :class="{ 'error': segmentErrors.downsigid }"
              />
              <div v-if="segmentErrors.downsigid" class="error-message">
                {{ segmentErrors.downsigid }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeSegmentModal" class="btn btn-secondary">取消</button>
          <button @click="saveSegmentConfig" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 等待区配置编辑弹窗 -->
    <div v-if="showWaitingAreaModal" class="modal-overlay" @click="closeWaitingAreaModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑等待区配置</h3>
          <button @click="closeWaitingAreaModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group readonly-field">
              <label class="form-label">等待区索引 (只读)</label>
              <input
                v-model="editingWaitingArea.index"
                type="number"
                class="form-input readonly"
                readonly
              />
              <div class="form-hint">此参数不允许修改</div>
            </div>
            <div class="form-group">
              <label class="form-label">上行容量</label>
              <input
                v-model.number="editingWaitingArea.upCapacity"
                type="number"
                min="1"
                max="100"
                class="form-input"
                :class="{ 'error': waitingAreaErrors.upCapacity }"
              />
              <div v-if="waitingAreaErrors.upCapacity" class="error-message">
                {{ waitingAreaErrors.upCapacity }}
              </div>
              <div class="form-hint">取值范围: 1-100</div>
            </div>
            <div class="form-group">
              <label class="form-label">下行容量</label>
              <input
                v-model.number="editingWaitingArea.downCapacity"
                type="number"
                min="1"
                max="100"
                class="form-input"
                :class="{ 'error': waitingAreaErrors.downCapacity }"
              />
              <div v-if="waitingAreaErrors.downCapacity" class="error-message">
                {{ waitingAreaErrors.downCapacity }}
              </div>
              <div class="form-hint">取值范围: 1-100</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeWaitingAreaModal" class="btn btn-secondary">取消</button>
          <button @click="saveWaitingAreaConfig" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 全局配置编辑弹窗 -->
    <div v-if="showGlobalModal" class="modal-overlay" @click="closeGlobalModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑全局配置</h3>
          <button @click="closeGlobalModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="constraints-reminder">
            <div class="reminder-icon">⚠️</div>
            <div class="reminder-text">只允许修改 AllRed 和 MaxAllRed 参数</div>
          </div>
          <div class="form-group">
            <label class="form-label">全红时间 (秒)</label>
            <input
              v-model.number="editingGlobal.allRed"
              type="number"
              min="1"
              max="600"
              class="form-input"
              :class="{ 'error': globalErrors.allRed }"
            />
            <div v-if="globalErrors.allRed" class="error-message">
              {{ globalErrors.allRed }}
            </div>
            <div class="form-hint">取值范围: 1-600秒</div>
          </div>
          <div class="form-group">
            <label class="form-label">最大全红时间 (秒)</label>
            <input
              v-model.number="editingGlobal.maxAllRed"
              type="number"
              min="1"
              max="1200"
              class="form-input"
              :class="{ 'error': globalErrors.maxAllRed }"
            />
            <div v-if="globalErrors.maxAllRed" class="error-message">
              {{ globalErrors.maxAllRed }}
            </div>
            <div class="form-hint">取值范围: 1-1200秒，必须大于等于全红时间</div>
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
          <div class="health-status" :class="healthStatus.success ? 'up' : 'down'">
            <div class="status-icon">
              {{ healthStatus.success ? '✅' : '❌' }}
            </div>
            <div class="status-text">
              {{ healthStatus.message || '未知状态' }}
            </div>
          </div>
          <div class="health-details">
            <div class="health-item">
              <h4>配置文件状态</h4>
              <div class="health-value" :class="{ 'healthy': healthStatus.configExists }">
                {{ healthStatus.configExists ? '正常' : '异常' }}
              </div>
            </div>
            <div class="health-item">
              <h4>检查时间</h4>
              <div class="health-value">
                {{ formatTimestamp(healthStatus.timestamp) }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeHealthModal" class="btn btn-primary">关闭</button>
        </div>
      </div>
    </div>

    <!-- 配置约束说明弹窗 -->
    <div v-if="showConstraintsModal" class="modal-overlay" @click="closeConstraintsModal">
      <div class="modal-content constraints-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">配置约束说明</h3>
          <button @click="closeConstraintsModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="constraints-content">
            <div v-for="(rule, key) in constraintsInfo.rules" :key="key" class="constraint-item">
              <h4>{{ key }}</h4>
              <p>{{ rule }}</p>
            </div>
            <div class="allowed-operations">
              <h4>允许的操作</h4>
              <div class="operations-grid">
                <div class="operation-group">
                  <strong>查询操作 (GET)</strong>
                  <ul>
                    <li v-for="op in constraintsInfo.allowedOperations?.GET" :key="op">{{ op }}</li>
                  </ul>
                </div>
                <div class="operation-group">
                  <strong>修改操作 (PUT)</strong>
                  <ul>
                    <li v-for="op in constraintsInfo.allowedOperations?.PUT" :key="op">{{ op }}</li>
                  </ul>
                </div>
                <div class="operation-group">
                  <strong>工具操作 (POST)</strong>
                  <ul>
                    <li v-for="op in constraintsInfo.allowedOperations?.POST" :key="op">{{ op }}</li>
                  </ul>
                </div>
                <div class="operation-group forbidden">
                  <strong>禁止操作</strong>
                  <ul>
                    <li v-for="op in constraintsInfo.allowedOperations?.禁止操作" :key="op">{{ op }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeConstraintsModal" class="btn btn-primary">关闭</button>
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
import { newConfigApiService } from '@/api/configService'

// 定义类型接口
interface GlobalConfig {
  allRed: number
  maxAllRed: number
  platformUrl?: string
  signalControllerList?: { name: string; id: string }[]
}

interface SegmentConfig {
  segmentId: number
  name: string
  length: number
  minRed: number
  maxRed: number
  minGreen: number
  maxGreen: number
  upsigid: string
  downsigid: string
}

interface WaitingArea {
  index: number
  upCapacity: number
  downCapacity: number
}

interface DetectPoint {
  index: number
  details: string
}

interface HealthStatus {
  success: boolean
  message: string
  configExists?: boolean
  timestamp?: number
}

interface ConstraintsInfo {
  rules: Record<string, string>
  allowedOperations: Record<string, string[]>
  version?: string
  lastUpdated?: number
}

// 响应式数据
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// 全局配置
const globalConfig = ref<GlobalConfig>({
  allRed: 120,
  maxAllRed: 300
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
const editingSegment = ref<SegmentConfig>({
  segmentId: 0,
  name: '',
  length: 0,
  minRed: 0,
  maxRed: 0,
  minGreen: 0,
  maxGreen: 0,
  upsigid: '',
  downsigid: ''
})
const segmentErrors = ref<Record<string, string>>({})

// 等待区配置
const waitingAreas = ref<WaitingArea[]>([])
const showWaitingAreaModal = ref(false)
const editingWaitingArea = ref<WaitingArea>({
  index: 0,
  upCapacity: 0,
  downCapacity: 0
})
const waitingAreaErrors = ref<Record<string, string>>({})

// 检测点配置（只读）
const detectPoints = ref<DetectPoint[]>([])

// 健康检查
const showHealthModal = ref(false)
const healthStatus = ref<HealthStatus>({
  success: false,
  message: ''
})

// 约束信息
const showConstraintsModal = ref(false)
const constraintsInfo = ref<ConstraintsInfo>({
  rules: {},
  allowedOperations: {}
})

// 计算属性
const filteredSegments = computed(() => {
  if (!searchQuery.value) return segments.value

  const query = searchQuery.value.toLowerCase()
  return segments.value.filter(segment =>
    segment.name.toLowerCase().includes(query) ||
    segment.segmentId.toString().includes(query) ||
    segment.upsigid.includes(query) ||
    segment.downsigid.includes(query)
  )
})

// 加载完整配置数据
const loadConfigs = async () => {
  isLoading.value = true
  try {
    // 获取完整配置
    const fullConfig = await newConfigApiService.getFullConfig()

    // 设置全局配置
    globalConfig.value = fullConfig.global

    // 设置路段配置
    segments.value = fullConfig.segments.segmentList || []

    // 设置等待区配置
    waitingAreas.value = fullConfig.waitingAreas.waitingAreas || []

    // 设置检测点配置
    detectPoints.value = fullConfig.detectPoints.detectPointList || []

    showMessage('配置加载成功', 'success')
  } catch (error: any) {
    showMessage(`加载配置失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 刷新配置
const refreshConfig = async () => {
  try {
    await newConfigApiService.refreshConfig()
    await loadConfigs()
    showMessage('配置刷新成功', 'success')
  } catch (error: any) {
    showMessage(`配置刷新失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  }
}

// 健康检查
const checkHealth = async () => {
  try {
    const result = await newConfigApiService.healthCheck()
    healthStatus.value = result
    showHealthModal.value = true
  } catch (error: any) {
    showMessage(`健康检查失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  }
}

// 测试API连接
const testConnection = async () => {
  isLoading.value = true
  try {
    const result = await newConfigApiService.testConnection()
    if (result.success) {
      showMessage(`连接成功 (延迟: ${result.latency}ms)`, 'success')
    } else {
      showMessage(`连接失败: ${result.message}`, 'error')
    }
  } catch (error: any) {
    showMessage(`连接测试失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 显示约束信息
const showConstraints = async () => {
  try {
    const result = await newConfigApiService.getConstraints()
    constraintsInfo.value = result
    showConstraintsModal.value = true
  } catch (error: any) {
    showMessage(`获取约束信息失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  }
}

// 全局配置相关
const editGlobalConfig = () => {
  editingGlobal.value = {
    allRed: globalConfig.value.allRed,
    maxAllRed: globalConfig.value.maxAllRed
  }
  globalErrors.value = {}
  showGlobalModal.value = true
}

const validateGlobalConfig = (): boolean => {
  globalErrors.value = {}

  if (editingGlobal.value.allRed < 1 || editingGlobal.value.allRed > 600) {
    globalErrors.value.allRed = '全红时间必须在1-600秒之间'
  }

  if (editingGlobal.value.maxAllRed < 1 || editingGlobal.value.maxAllRed > 1200) {
    globalErrors.value.maxAllRed = '最大全红时间必须在1-1200秒之间'
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
    await newConfigApiService.updateGlobalConfig({
      allRed: editingGlobal.value.allRed,
      maxAllRed: editingGlobal.value.maxAllRed
    })

    // 更新本地数据
    globalConfig.value.allRed = editingGlobal.value.allRed
    globalConfig.value.maxAllRed = editingGlobal.value.maxAllRed

    showGlobalModal.value = false
    showMessage('全局配置保存成功', 'success')
  } catch (error: any) {
    showMessage(`保存失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  } finally {
    isSaving.value = false
  }
}

const closeGlobalModal = () => {
  showGlobalModal.value = false
  globalErrors.value = {}
}

// 路段配置相关
const handleEditSegment = (segment: SegmentConfig) => {
  editingSegment.value = { ...segment }
  segmentErrors.value = {}
  showSegmentModal.value = true
}

const validateSegmentConfig = (): boolean => {
  segmentErrors.value = {}

  if (!editingSegment.value.name.trim()) {
    segmentErrors.value.name = '路段名称不能为空'
  }

  if (editingSegment.value.length <= 0) {
    segmentErrors.value.length = '路段长度必须大于0'
  }

  if (editingSegment.value.minRed <= 0) {
    segmentErrors.value.minRed = '最小红灯时间必须大于0'
  }

  if (editingSegment.value.maxRed <= 0) {
    segmentErrors.value.maxRed = '最大红灯时间必须大于0'
  }

  if (editingSegment.value.minRed > editingSegment.value.maxRed) {
    segmentErrors.value.maxRed = '最大红灯时间必须大于等于最小红灯时间'
  }

  if (editingSegment.value.minGreen <= 0) {
    segmentErrors.value.minGreen = '最小绿灯时间必须大于0'
  }

  if (editingSegment.value.maxGreen <= 0) {
    segmentErrors.value.maxGreen = '最大绿灯时间必须大于0'
  }

  if (editingSegment.value.minGreen > editingSegment.value.maxGreen) {
    segmentErrors.value.maxGreen = '最大绿灯时间必须大于等于最小绿灯时间'
  }

  if (!editingSegment.value.downsigid.trim()) {
    segmentErrors.value.downsigid = '下行信号ID不能为空'
  }

  return Object.keys(segmentErrors.value).length === 0
}

const saveSegmentConfig = async () => {
  if (!validateSegmentConfig()) return

  isSaving.value = true
  try {
    // 使用upsigid作为路径参数，根据API文档要求
    await newConfigApiService.updateSegmentConfig(editingSegment.value.upsigid, editingSegment.value)

    // 更新本地数据
    const index = segments.value.findIndex(s => s.segmentId === editingSegment.value.segmentId)
    if (index !== -1) {
      segments.value[index] = { ...editingSegment.value }
    }

    showSegmentModal.value = false
    showMessage('路段配置更新成功', 'success')
  } catch (error: any) {
    showMessage(`保存失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  } finally {
    isSaving.value = false
  }
}

const closeSegmentModal = () => {
  showSegmentModal.value = false
  segmentErrors.value = {}
}

// 等待区配置相关
const handleEditWaitingArea = (area: WaitingArea) => {
  editingWaitingArea.value = { ...area }
  waitingAreaErrors.value = {}
  showWaitingAreaModal.value = true
}

const validateWaitingAreaConfig = (): boolean => {
  waitingAreaErrors.value = {}

  if (editingWaitingArea.value.upCapacity < 1 || editingWaitingArea.value.upCapacity > 100) {
    waitingAreaErrors.value.upCapacity = '上行容量必须在1-100之间'
  }

  if (editingWaitingArea.value.downCapacity < 1 || editingWaitingArea.value.downCapacity > 100) {
    waitingAreaErrors.value.downCapacity = '下行容量必须在1-100之间'
  }

  return Object.keys(waitingAreaErrors.value).length === 0
}

const saveWaitingAreaConfig = async () => {
  if (!validateWaitingAreaConfig()) return

  isSaving.value = true
  try {
    await newConfigApiService.updateWaitingAreaConfig(editingWaitingArea.value.index, editingWaitingArea.value)

    // 更新本地数据
    const index = waitingAreas.value.findIndex(w => w.index === editingWaitingArea.value.index)
    if (index !== -1) {
      waitingAreas.value[index] = { ...editingWaitingArea.value }
    }

    showWaitingAreaModal.value = false
    showMessage('等待区配置更新成功', 'success')
  } catch (error: any) {
    showMessage(`保存失败: ${newConfigApiService.handleApiError(error)}`, 'error')
  } finally {
    isSaving.value = false
  }
}

const closeWaitingAreaModal = () => {
  showWaitingAreaModal.value = false
  waitingAreaErrors.value = {}
}

// 弹窗关闭方法
const closeHealthModal = () => {
  showHealthModal.value = false
}

const closeConstraintsModal = () => {
  showConstraintsModal.value = false
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

// 工具函数
const formatTimestamp = (timestamp?: number): string => {
  return newConfigApiService.formatTimestamp(timestamp)
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
  flex-wrap: wrap;
}

.refresh-btn, .health-btn, .constraints-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: white;
}

.refresh-btn {
  background: #667eea;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.health-btn {
  background: #28a745;
}

.health-btn:hover {
  background: #218838;
}

.test-btn {
  background: #fd7e14;
}

.test-btn:hover {
  background: #e8690b;
}

.constraints-btn {
  background: #17a2b8;
}

.constraints-btn:hover {
  background: #138496;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 约束说明样式 */
.constraints-notice {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.notice-icon {
  font-size: 1.5rem;
}

.notice-content {
  flex: 1;
}

.notice-content strong {
  color: #856404;
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
  flex-wrap: wrap;
}

.edit-btn {
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

.edit-btn:hover:not(:disabled) {
  background: #218838;
}

.readonly-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.readonly-notice.readonly {
  background: #e9ecef;
  color: #495057;
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

.config-value.readonly {
  color: #6c757d;
  font-size: 1.5rem;
}

.config-description {
  font-size: 0.9rem;
  color: #6c757d;
}

.config-description.readonly {
  color: #999;
  font-style: italic;
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
  grid-template-columns: 1fr 100px 80px 80px 80px 80px 100px 100px 80px;
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
  grid-template-columns: 1fr 100px 80px 80px 80px 80px 100px 100px 80px;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
}

.segment-row:hover {
  background: #f8f9fa;
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

.segment-cell.readonly {
  background: #f8f9fa;
  color: #6c757d;
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

.no-segments {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

/* 等待区配置样式 */
.waiting-areas-container {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.waiting-areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.waiting-area-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.area-header h3 {
  margin: 0;
  color: #495057;
}

.area-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.capacity-item {
  text-align: center;
}

.capacity-item label {
  display: block;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.capacity-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

/* 检测点配置样式 */
.detect-points-container {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detect-points-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.detect-point-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.detect-point-item.readonly {
  background: #e9ecef;
  color: #6c757d;
}

.point-index {
  font-weight: bold;
  font-size: 1.2rem;
  color: #495057;
  min-width: 30px;
}

.point-details {
  flex: 1;
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

.modal-content.health-modal,
.modal-content.constraints-modal {
  max-width: 700px;
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

/* 约束提醒样式 */
.constraints-reminder {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
}

.reminder-icon {
  font-size: 1.2rem;
}

.reminder-text {
  color: #856404;
  font-weight: 500;
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

.form-input.readonly {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.readonly-field {
  opacity: 0.7;
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

/* 约束内容样式 */
.constraints-content {
  max-height: 60vh;
  overflow-y: auto;
}

.constraint-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.constraint-item:last-child {
  border-bottom: none;
}

.constraint-item h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.constraint-item p {
  margin: 0;
  color: #6c757d;
  line-height: 1.5;
}

.allowed-operations {
  margin-top: 1.5rem;
}

.allowed-operations h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.operations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.operation-group {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.operation-group.forbidden {
  background: #f8d7da;
  border-color: #f5c6cb;
}

.operation-group strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #495057;
}

.operation-group.forbidden strong {
  color: #721c24;
}

.operation-group ul {
  margin: 0;
  padding-left: 1.5rem;
}

.operation-group li {
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.operation-group.forbidden li {
  color: #721c24;
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
    grid-template-columns: 1fr 90px 70px 70px 70px 70px 90px 90px 70px;
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
    grid-template-columns: 1fr 80px 60px 60px 60px 60px 80px 80px 60px;
    font-size: 0.9rem;
  }

  .segment-cell {
    padding: 0.75rem 0.25rem;
  }

  .config-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .waiting-areas-grid {
    grid-template-columns: 1fr;
  }

  .detect-points-list {
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
    flex-wrap: wrap;
  }

  .search-input {
    width: 150px;
  }

  .segments-container {
    overflow-x: auto;
  }

  .segments-header,
  .segment-row {
    min-width: 700px;
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

  .operations-grid {
    grid-template-columns: 1fr;
  }

  .message-toast {
    right: 10px;
    left: 10px;
    min-width: auto;
  }

  .constraints-notice {
    flex-direction: column;
    text-align: center;
  }

  .area-content {
    grid-template-columns: 1fr;
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
    align-items: stretch;
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

  .readonly-notice {
    text-align: center;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
