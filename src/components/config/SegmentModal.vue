<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <span class="title-icon">{{ isEditing ? '✏️' : '➕' }}</span>
          {{ isEditing ? '编辑路段' : '添加路段' }}
        </h3>
        <button @click="handleClose" class="close-btn" :disabled="loading">✕</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit" class="segment-form">
          <div class="form-grid">
            <!-- 路段名称 -->
            <div class="form-group" style="grid-area: name;">
              <label class="form-label required">路段名称</label>
              <input
                v-model="formData.name"
                type="text"
                maxlength="50"
                placeholder="请输入路段名称"
                class="form-input"
                :class="{ 'error': errors.name }"
                :disabled="loading"
                @input="clearError('name')"
              />
              <div v-if="errors.name" class="error-message">
                {{ errors.name }}
              </div>
              <div class="form-hint">2-50个字符，支持中英文数字</div>
            </div>

            <!-- 信号灯ID -->
<!--            <div class="form-group" style="grid-area: sigid;">-->
<!--              <label class="form-label required">信号灯ID</label>-->
<!--              <input-->
<!--                v-model="formData.sigid"-->
<!--                type="text"-->
<!--                pattern="[0-9]{1,6}"-->
<!--                maxlength="6"-->
<!--                placeholder="请输入最多6位数字ID"-->
<!--                class="form-input"-->
<!--                :class="{ 'error': errors.sigid }"-->
<!--                :disabled="loading || isEditing"-->
<!--                @input="clearError('sigid')"-->
<!--              />-->
<!--              <div v-if="errors.sigid" class="error-message">-->
<!--                {{ errors.sigid }}-->
<!--              </div>-->
<!--              <div class="form-hint">-->
<!--                {{ isEditing ? '创建后不可修改' : '最多6位数字，系统内唯一' }}-->
<!--              </div>-->
<!--            </div>-->

            <!-- 全红时间 -->
            <div class="form-group" style="grid-area: allred;">
              <label class="form-label required">全红时间 (秒)</label>
              <input
                v-model.number="formData.allred"
                type="number"
                min="10"
                max="300"
                placeholder="10-300"
                class="form-input"
                :class="{ 'error': errors.allred }"
                :disabled="loading"
                @input="clearError('allred')"
              />
              <div v-if="errors.allred" class="error-message">
                {{ errors.allred }}
              </div>
              <div class="form-hint">取值范围: 10-300秒</div>
            </div>

            <!-- 上行控制相位 -->
            <div class="form-group" style="grid-area: upctrl;">
              <label class="form-label required">上行控制相位</label>
              <select
                v-model.number="formData.upctrl"
                class="form-select"
                :class="{ 'error': errors.upctrl }"
                :disabled="loading"
                @change="clearError('upctrl')"
              >
                <option value="" disabled>请选择相位</option>
                <option v-for="option in CONTROL_PHASES_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div v-if="errors.upctrl" class="error-message">
                {{ errors.upctrl }}
              </div>
            </div>

            <!-- 下行控制相位 -->
            <div class="form-group" style="grid-area: downctrl;">
              <label class="form-label required">下行控制相位</label>
              <select
                v-model.number="formData.downctrl"
                class="form-select"
                :class="{ 'error': errors.downctrl }"
                :disabled="loading"
                @change="clearError('downctrl')"
              >
                <option value="" disabled>请选择相位</option>
                <option v-for="option in CONTROL_PHASES_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div v-if="errors.downctrl" class="error-message">
                {{ errors.downctrl }}
              </div>
              <div class="form-hint">不能与上行控制相位相同</div>
            </div>

            <!-- 进入区域 -->
            <div class="form-group" style="grid-area: inzone">
              <label class="form-label required">进入区域</label>
              <select
                v-model.number="formData.inzone"
                class="form-select"
                :class="{ 'error': errors.inzone }"
                :disabled="loading"
                @change="clearError('inzone')"
              >
                <option value="" disabled>请选择区域</option>
                <option v-for="option in regionOptions" :key="option.value" :label="option.label" :value="option.value" />
              </select>
              <div v-if="errors.inzone" class="error-message">
                {{ errors.inzone }}
              </div>
            </div>

            <!-- 离开区域 -->
            <div class="form-group" style="grid-area: outzone;">
              <label class="form-label required">离开区域</label>
              <select
                v-model.number="formData.outzone"
                class="form-select"
                :class="{ 'error': errors.outzone }"
                :disabled="loading"
                @change="clearError('outzone')"
              >
                <option value="" disabled>请选择区域</option>
                <option v-for="option in regionOptions" :key="option.value" :label="option.label" :value="option.value" />
              </select>
              <div v-if="errors.outzone" class="error-message">
                {{ errors.outzone }}
              </div>
            </div>
          </div>

          <!-- 表单预览 -->
          <div v-if="showPreview" class="form-preview">
            <h4 class="preview-title">配置预览</h4>
            <div class="preview-content">
              <div class="preview-item">
                <span class="preview-label">路段名称:</span>
                <span class="preview-value">{{ formData.name || '未设置' }}</span>
              </div>
<!--              <div class="preview-item">-->
<!--                <span class="preview-label">信号灯ID:</span>-->
<!--                <span class="preview-value">{{ formData.sigid || '未设置' }}</span>-->
<!--              </div>-->
              <div class="preview-item">
                <span class="preview-label">全红时间:</span>
                <span class="preview-value">{{ formData.allred || 0 }} 秒</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">控制相位:</span>
                <span class="preview-value">
                  上行 {{ CONTROL_PHASE_MAP[formData.upctrl] || '?' }} / 下行 {{ CONTROL_PHASE_MAP[formData.downctrl] || '?' }}
                </span>
              </div>
              <div class="preview-item">
                <span class="preview-label">进出区域:</span>
                <span class="preview-value">
                  {{ regionList[formData.inzone] || '?' }} → {{ regionList[formData.outzone] || '?' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button
              type="button"
              @click="togglePreview"
              class="btn btn-secondary"
              :disabled="loading"
            >
              <span class="btn-icon">{{ showPreview ? '🔼' : '🔽' }}</span>
              {{ showPreview ? '隐藏预览' : '显示预览' }}
            </button>

            <div class="action-buttons">
              <button
                type="button"
                @click="handleClose"
                class="btn btn-secondary"
                :disabled="loading"
              >
                取消
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading || !isFormValid"
              >
                <span v-if="loading" class="loading-spinner"></span>
                <span class="btn-icon">{{ isEditing ? '💾' : '➕' }}</span>
                {{ loading ? '保存中...' : (isEditing ? '更新' : '添加') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { CONTROL_PHASES_OPTIONS, CONTROL_PHASE_MAP } from '@/utils/constants.ts'
import { type GlobalConfig } from '@/api/config.ts'

// 类型定义
interface SegmentConfig {
  name: string
  sigid: string
  allred: number
  upctrl: number
  downctrl: number
  inzone: number
  outzone: number
}

interface Props {
  visible: boolean
  segment?: SegmentConfig | null
  globalConfig: GlobalConfig
  existingSegments?: SegmentConfig[]
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: SegmentConfig): void
  (e: 'update:visible', value: boolean): void
}

// Props 和 Emits
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  segment: null,
  existingSegments: () => [],
  loading: false
})

const emit = defineEmits<Emits>()

const regionList = computed(() => {

  // 兼容regionNames
  if (props.globalConfig?.regionNames) {
    if (Array.isArray(props.globalConfig.regionNames)) {
      return props.globalConfig.regionNames
    }

    if (typeof props.globalConfig.regionNames === 'object') {
      return Object.values(props.globalConfig.regionNames)
    }
  }

  return []
})

// 计算属性：基础选择器选项
const regionOptions = computed(() => {
  return regionList.value.map((name, index) => ({
    label: `${name}`,
    value: index,
    disabled: false // 可以根据业务逻辑设置禁用状态
  }))
})

// 响应式数据
const formData = ref<SegmentConfig>({
  name: '',
  sigid: '',
  allred: 60,
  upctrl: 1,
  downctrl: 2,
  inzone: 2,
  outzone: 2
})

const errors = ref<Record<string, string>>({})
const showPreview = ref(false)

// 计算属性
const isEditing = computed(() => !!props.segment)

const isFormValid = computed(() => {
  return (
    formData.value.name.length >= 2 &&
    /^\d{5}$/.test(formData.value.sigid) &&
    formData.value.allred >= 10 &&
    formData.value.allred <= 300 &&
    formData.value.upctrl !== formData.value.downctrl &&
    formData.value.upctrl >= 1 &&
    formData.value.upctrl <= 100 &&
    formData.value.downctrl >= 1 &&
    formData.value.downctrl <= 100 &&
    formData.value.inzone >= 0 &&
    formData.value.inzone <= 10 &&
    formData.value.outzone >= 0 &&
    formData.value.outzone <= 10 &&
    Object.keys(errors.value).length === 0
  )
})

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initForm()
    nextTick(() => {
      // 聚焦到第一个输入框
      const firstInput = document.querySelector('.segment-form input') as HTMLInputElement
      firstInput?.focus()
    })
  } else {
    resetForm()
  }
})

watch(() => props.segment, () => {
  if (props.visible) {
    initForm()
  }
})

// 自动验证
watch(() => formData.value.upctrl, () => {
  if (formData.value.upctrl === formData.value.downctrl && formData.value.downctrl !== 0) {
    errors.value.downctrl = '上行和下行控制相位不能相同'
  } else {
    delete errors.value.downctrl
  }
})

watch(() => formData.value.downctrl, () => {
  if (formData.value.upctrl === formData.value.downctrl && formData.value.upctrl !== 0) {
    errors.value.downctrl = '上行和下行控制相位不能相同'
  } else {
    delete errors.value.downctrl
  }
})

// 方法
const initForm = () => {
  if (props.segment) {
    // 编辑模式：填充现有数据
    formData.value = { ...props.segment }
  } else {
    // 添加模式：重置为默认值
    formData.value = {
      name: '',
      sigid: '',
      allred: 60,
      upctrl: 1,
      downctrl: 2,
      inzone: 2,
      outzone: 2
    }
  }
  errors.value = {}
  showPreview.value = false
}

const resetForm = () => {
  formData.value = {
    name: '',
    sigid: '',
    allred: 60,
    upctrl: 1,
    downctrl: 2,
    inzone: 2,
    outzone: 2
  }
  errors.value = {}
  showPreview.value = false
}

const validateForm = (): boolean => {
  errors.value = {}

  // 路段名称验证
  if (!formData.value.name || formData.value.name.length < 2) {
    errors.value.name = '路段名称不能少于2个字符'
  } else if (formData.value.name.length > 50) {
    errors.value.name = '路段名称不能超过50个字符'
  }

  // 信号灯ID验证
  if (!formData.value.sigid || !/^\d{1,6}$/.test(formData.value.sigid)) {
    errors.value.sigid = '信号灯ID必须是1到6位数字'
  } else if (!isEditing.value) {
    // 检查ID重复（仅新增时）
    const existingSegment = props.existingSegments?.find(s => s.sigid === formData.value.sigid)
    if (existingSegment) {
      errors.value.sigid = '信号灯ID已存在'
    }
  }

  // 全红时间验证
  if (formData.value.allred < 10 || formData.value.allred > 300) {
    errors.value.allred = '全红时间必须在10-300秒之间'
  }

  // 控制相位验证
  if (formData.value.upctrl < 1 || formData.value.upctrl > 100) {
    errors.value.upctrl = '上行控制相位必须在1-100之间'
  }

  if (formData.value.downctrl < 1 || formData.value.downctrl > 100) {
    errors.value.downctrl = '下行控制相位必须在1-100之间'
  }

  if (formData.value.upctrl === formData.value.downctrl) {
    errors.value.downctrl = '上行和下行控制相位不能相同'
  }

  // 区域验证
  if (formData.value.inzone < 0 || formData.value.inzone > 10) {
    errors.value.inzone = '进入区域必须在0-10之间'
  }

  if (formData.value.outzone < 0 || formData.value.outzone > 10) {
    errors.value.outzone = '离开区域必须在0-10之间'
  }

  // 检查名称重复
  if (!isEditing.value || (isEditing.value && formData.value.name !== props.segment?.name)) {
    const existingByName = props.existingSegments?.find(s =>
      s.name === formData.value.name && s.sigid !== formData.value.sigid
    )
    if (existingByName) {
      errors.value.name = '路段名称已存在'
    }
  }

  return Object.keys(errors.value).length === 0
}

const clearError = (field: string) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', { ...formData.value })
  }
}

const handleClose = () => {
  emit('close')
  emit('update:visible', false)
}

const handleOverlayClick = () => {
  if (!props.loading) {
    handleClose()
  }
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible && !props.loading) {
    handleClose()
  } else if (event.key === 'Enter' && event.ctrlKey && isFormValid.value) {
    handleSubmit()
  }
}

// 组件挂载时添加键盘监听
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}

// 组件卸载时移除监听
// 注意：在 setup 中无法直接使用 onUnmounted，需要通过 getCurrentInstance
</script>

<style scoped>
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
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.5rem;
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

.close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.segment-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  /* 定义三列，每列1fr，或者根据需要设置固定宽度 */
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  /* 定义网格区域，用字符串表示行和列的布局 */
  grid-template-areas:
    "name     allred "  /*   sigid*/
    "upctrl   downctrl " /* 第3列用'.'表示空单元格 .     */
    "inzone   outzone ";/* . */
  /* 针对手机屏幕的响应式调整 */
  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* 单列 */
    grid-template-areas:
      "name"
      "sigid"
      "allred"
      "upctrl"
      "downctrl"
      "inzone"
      "outzone";
  }
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-input.error,
.form-select.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.form-input:disabled,
.form-select:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-hint {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #6c757d;
}

.error-message {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #dc3545;
  font-weight: 500;
}

.form-preview {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.preview-title {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
}

.preview-content {
  display: grid;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.preview-label {
  font-weight: 500;
  color: #6c757d;
}

.preview-value {
  font-weight: 600;
  color: #495057;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.9rem;
  text-decoration: none;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1rem;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    justify-content: stretch;
  }

  .btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .form-actions {
    gap: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
}
</style>
