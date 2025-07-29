<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ zone.name }} - 控制面板</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 会车区状态信息 -->
<!--        <div class="zone-status">-->
<!--          <div class="status-section">-->
<!--            <h3 class="section-title">当前状态</h3>-->
<!--            <div class="status-grid">-->
<!--              <div class="status-item">-->
<!--                <span class="status-label">总容量:</span>-->
<!--                <span class="status-value">{{ zone.capacity }} 辆</span>-->
<!--              </div>-->
<!--              <div class="status-item">-->
<!--                <span class="status-label">当前占用:</span>-->
<!--                <span class="status-value">{{ totalOccupancy }} 辆</span>-->
<!--              </div>-->
<!--              <div class="status-item">-->
<!--                <span class="status-label">占用率:</span>-->
<!--                <span class="status-value" :class="occupancyClass">{{ occupancyRate }}%</span>-->
<!--              </div>-->
<!--              <div class="status-item">-->
<!--                <span class="status-label">状态:</span>-->
<!--                <span class="status-value" :class="zone.full ? 'full' : 'available'">-->
<!--                  {{ zone.full ? '已满' : '可用' }}-->
<!--                </span>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->

          <!-- 方向状态 -->
<!--          <div class="directions-status">-->
<!--            <div class="direction-item">-->
<!--              <h4 class="direction-title">上行方向</h4>-->
<!--              <div class="direction-details">-->
<!--                <span class="direction-status" :class="`status-${zone.upstream}`">-->
<!--                  {{ getZoneStatusText(zone.upstream) }}-->
<!--                </span>-->
<!--                <span class="vehicle-count">({{ zone.upstreamCount }} 辆)</span>-->
<!--              </div>-->
<!--            </div>-->

<!--            <div class="direction-item">-->
<!--              <h4 class="direction-title">下行方向</h4>-->
<!--              <div class="direction-details">-->
<!--                <span class="direction-status" :class="`status-${zone.downstream}`">-->
<!--                  {{ getZoneStatusText(zone.downstream) }}-->
<!--                </span>-->
<!--                <span class="vehicle-count">({{ zone.downstreamCount }} 辆)</span>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->

          <!-- 占用率可视化 -->
<!--          <div class="occupancy-visual">-->
<!--            <h4>占用率可视化</h4>-->
<!--            <div class="occupancy-bar">-->
<!--              <div-->
<!--                class="occupancy-fill"-->
<!--                :style="{ width: occupancyRate + '%' }"-->
<!--                :class="occupancyBarClass"-->
<!--              ></div>-->
<!--            </div>-->
<!--            <div class="occupancy-text">{{ totalOccupancy }}/{{ zone.capacity }}</div>-->
<!--          </div>-->
<!--        </div>-->

        <!-- 控制按钮区域 -->
        <div class="control-section">
          <h3 class="section-title">交通控制</h3>
          <div class="control-buttons">
            <button
              class="control-btn release-upstream"
              @click="handleControl('release_upstream')"
              :disabled="!canReleaseUpstream"
              :title="canReleaseUpstream ? '放行上行车辆' : '当前无法放行上行'"
            >
              <span class="btn-icon">⬆️</span>
              <span class="btn-text">放行上行</span>
            </button>

            <button
              class="control-btn release-downstream"
              @click="handleControl('release_downstream')"
              :disabled="!canReleaseDownstream"
              :title="canReleaseDownstream ? '放行下行车辆' : '当前无法放行下行'"
            >
              <span class="btn-icon">⬇️</span>
              <span class="btn-text">放行下行</span>
            </button>

            <button
              class="control-btn prohibit-all"
              @click="handleControl('prohibit_all')"
              :title="'禁止所有方向通行'"
            >
              <span class="btn-icon">🚫</span>
              <span class="btn-text">禁止通行</span>
            </button>

            <button
              class="control-btn release-control"
              @click="handleControl('release_control')"
              :title="'解除人工控制，恢复自动模式'"
            >
              <span class="btn-icon">🔓</span>
              <span class="btn-text">解除控制</span>
            </button>
          </div>
        </div>

        <!-- 操作提示 -->
        <div class="operation-tips">
          <h4>操作说明</h4>
          <ul>
            <li><strong>放行上行:</strong> 允许上行方向车辆进入会车区</li>
            <li><strong>放行下行:</strong> 允许下行方向车辆进入会车区</li>
            <li><strong>禁止通行:</strong> 禁止所有方向车辆进入会车区</li>
            <li><strong>解除控制:</strong> 恢复系统自动控制模式</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MeetingZoneType } from '@/types/monitoring'

interface Props {
  zone: MeetingZoneType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  control: [data: { zoneId: number, action: string }]
}>()

// 计算属性
const totalOccupancy = computed(() => {
  return (props.zone.upstreamCount || 0) + (props.zone.downstreamCount || 0)
})

const occupancyRate = computed(() => {
  return Math.round((totalOccupancy.value / props.zone.capacity) * 100)
})

const occupancyClass = computed(() => {
  const rate = occupancyRate.value
  if (rate >= 90) return 'critical'
  if (rate >= 70) return 'warning'
  return 'normal'
})

const occupancyBarClass = computed(() => {
  const rate = occupancyRate.value
  if (rate >= 90) return 'critical'
  if (rate >= 70) return 'warning'
  return 'normal'
})

// 控制按钮可用性
const canReleaseUpstream = computed(() => {
  return !props.zone.full && totalOccupancy.value < props.zone.capacity
})

const canReleaseDownstream = computed(() => {
  return !props.zone.full && totalOccupancy.value < props.zone.capacity
})

// 状态文本转换
const getZoneStatusText = (status: string) => {
  switch (status) {
    case 'empty': return '空闲'
    case 'occupied': return '有车'
    case 'full': return '满载'
    default: return '未知'
  }
}

// 处理控制操作
const handleControl = (action: string) => {
  const actionMap = {
    'release_upstream': '放行上行',
    'release_downstream': '放行下行',
    'prohibit_all': '禁止通行',
    'release_control': '解除控制'
  }

  const actionText = actionMap[action as keyof typeof actionMap] || action

  if (confirm(`确认要执行"${actionText}"操作吗？`)) {
    emit('control', {
      zoneId: props.zone.id,
      action: action
    })
  }
}
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
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
  background: linear-gradient(135deg, #28a745, #20c997);
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
  max-height: 60vh;
  overflow-y: auto;
}

.zone-status {
  margin-bottom: 2rem;
}

.status-section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin-bottom: 1rem;
  color: #28a745;
  font-size: 1.1rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.status-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.status-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.status-value.critical { color: #dc3545; }
.status-value.warning { color: #ffc107; }
.status-value.normal { color: #28a745; }
.status-value.full { color: #dc3545; }
.status-value.available { color: #28a745; }

.directions-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.direction-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.direction-title {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1rem;
}

.direction-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.direction-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-empty {
  background: #e3f2fd;
  color: #1976d2;
}

.status-occupied {
  background: #fff3e0;
  color: #f57c00;
}

.status-full {
  background: #ffebee;
  color: #d32f2f;
}

.vehicle-count {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.occupancy-visual {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.occupancy-visual h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
}

.occupancy-bar {
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.occupancy-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 6px;
}

.occupancy-fill.normal { background: linear-gradient(90deg, #28a745, #20c997); }
.occupancy-fill.warning { background: linear-gradient(90deg, #ffc107, #fd7e14); }
.occupancy-fill.critical { background: linear-gradient(90deg, #dc3545, #e74c3c); }

.occupancy-text {
  text-align: center;
  font-weight: 600;
  color: #495057;
}

.control-section {
  margin-bottom: 2rem;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #495057;
}

.control-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.release-upstream {
  border-color: #007bff;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #1976d2;
}

.release-upstream:not(:disabled):hover {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
}

.release-downstream {
  border-color: #6f42c1;
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  color: #7b1fa2;
}

.release-downstream:not(:disabled):hover {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
}

.prohibit-all {
  border-color: #dc3545;
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  color: #d32f2f;
}

.prohibit-all:hover {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
}

.release-control {
  border-color: #28a745;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  color: #2e7d32;
}

.release-control:hover {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
}

.btn-icon {
  font-size: 1.5rem;
}

.btn-text {
  font-size: 0.9rem;
}

.operation-tips {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.operation-tips h4 {
  margin: 0 0 0.75rem 0;
  color: #0056b3;
  font-size: 1rem;
}

.operation-tips ul {
  margin: 0;
  padding-left: 1.5rem;
}

.operation-tips li {
  margin-bottom: 0.5rem;
  color: #495057;
  line-height: 1.4;
}

.operation-tips strong {
  color: #007bff;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  background: #f8f9fa;
}

.btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .directions-status {
    grid-template-columns: 1fr;
  }

  .control-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .status-grid {
    grid-template-columns: 1fr;
  }

  .control-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
