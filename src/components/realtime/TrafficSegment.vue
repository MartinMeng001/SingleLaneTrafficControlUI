<!-- src/components/realtime/TrafficSegment.vue -->
<template>
  <div class="segment" :class="segmentClasses">
    <div class="segment-info">
      路段 {{ segmentId }}<br>
      车辆总数: {{ vehicleCount }}<br>
      {{ lastVehicleAction?.vehicleId }}
<!--      <span v-if="congestionLevel !== null">-->
<!--        拥堵程度: {{ Math.round(congestionLevel * 100) }}%-->
<!--      </span>-->
    </div>

    <!-- 车辆动画效果 -->
    <div
      v-for="vehicle in animations"
      :key="vehicle.id"
      :class="['vehicle-animation', vehicle.type, vehicle.direction]"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LastVehicleAction } from '@/types/websocket'

interface Props {
  segmentId: number
  vehicleCount: number
  direction?: 'UPSTREAM' | 'DOWNSTREAM' | null
  congestionLevel?: number | null
  lastVehicleAction?: LastVehicleAction | null
}

interface VehicleAnimation {
  id: string
  type: 'vehicle-enter' | 'vehicle-leave'
  direction: 'upstream' | 'downstream'
}

const props = withDefaults(defineProps<Props>(), {
  vehicleCount: 0,
  direction: null,
  congestionLevel: null,
  lastVehicleAction: null
})

const animations = ref<VehicleAnimation[]>([])

// 计算路段样式类
const segmentClasses = computed(() => {
  const classes = []

  // 拥堵程度样式
  if (props.congestionLevel !== null) {
    if (props.congestionLevel >= 0.7) {
      classes.push('congested')
    } else if (props.congestionLevel >= 0.3) {
      classes.push('mild')
    } else {
      classes.push('clear')
    }
  } else {
    classes.push('clear')
  }

  // 通行方向样式
  if (props.direction === 'UPSTREAM') {
    classes.push('upstream-active')
  } else if (props.direction === 'DOWNSTREAM') {
    classes.push('downstream-active')
  }

  return classes
})

// 监听车辆动作变化，触发动画
watch(() => props.lastVehicleAction, (newAction) => {
  if (!newAction) return

  const animation: VehicleAnimation = {
    id: `${newAction.vehicleId}-${newAction.timestamp}`,
    type: newAction.status.toLowerCase().replace('_', '-') as 'vehicle-enter' | 'vehicle-leave',
    direction: newAction.direction?.toLowerCase() as 'upstream' | 'downstream'
  }

  animations.value.push(animation)

  // 1.5秒后移除动画
  setTimeout(() => {
    const index = animations.value.findIndex(a => a.id === animation.id)
    if (index > -1) {
      animations.value.splice(index, 1)
    }
  }, 1500)
}, { deep: true })
</script>

<style scoped>
.segment {
  width: 300px;
  height: 80px;
  background-color: #e0e0e0;
  border: 3px solid #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
}

.segment.congested {
  background-color: #ffcccc;
  border-color: #ff6b6b;
}

.segment.mild {
  background-color: #ffebcc;
  border-color: #ffa726;
}

.segment.clear {
  background-color: #ccffcc;
  border-color: #66bb6a;
}

.segment.upstream-active {
  background: linear-gradient(to right, #28a745 0%, #28a745 100%);
  color: white;
  border-color: #1e7e34;
}

.segment.downstream-active {
  background: linear-gradient(to left, #28a745 0%, #28a745 100%);
  color: white;
  border-color: #1e7e34;
}

.segment-info {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  line-height: 1.3;
  z-index: 5;
}

.vehicle-animation {
  position: absolute;
  width: 20px;
  height: 15px;
  background-color: #007bff;
  border-radius: 3px;
  z-index: 10;
  animation: vehicle-move 1.5s ease-in-out;

  /* 居中设置 */
  display: flex;
  justify-content: center; /* 水平居中 */
}

/* 上行车辆动画：使用向上的箭头 */
.vehicle-animation.vehicle-enter.upstream:before {
  content: '↑'; /* 或者 '⬆️' 等更复杂的符号 */
  font-size: 10px;
  color: #ffcccc;
  display: block;
  transform: rotate(0deg); /* 确保箭头方向正确 */
}

/* 下行车辆动画：使用向下的箭头 */
.vehicle-animation.vehicle-enter.downstream:before {
  content: '↓'; /* 或者 '⬇️' */
  font-size: 10px;
  color: #ffcccc;
  display: block;
  transform: rotate(0deg);
}

.vehicle-animation.vehicle-enter.upstream {
  bottom: 10px;
  left: 10px;
}

.vehicle-animation.vehicle-enter.downstream {
  top: 10px;
  right: 10px;
}

.vehicle-animation.vehicle-leave.upstream {
  top: 10px;
  right: 10px;
}

.vehicle-animation.vehicle-leave.downstream {
  bottom: 10px;
  left: 10px;
}

@keyframes vehicle-move {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .segment {
    width: 250px;
    height: 70px;
  }

  .segment-info {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .segment {
    width: 200px;
    height: 60px;
  }

  .segment-info {
    font-size: 11px;
  }
}
</style>
