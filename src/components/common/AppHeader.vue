<template>
  <header class="header">
    <div class="nav-container">
      <div class="logo">
        <span class="logo-icon">🚦</span>
        <span class="logo-text">感应式单车道动态让行系统</span>
      </div>

      <nav class="nav-tabs">
        <router-link
          v-for="route in routes"
          :key="route.name"
          :to="route.path"
          class="nav-tab"
          :class="{ active: $route.path === route.path }"
        >
          <span class="nav-icon">{{ route.meta?.icon }}</span>
          <span class="nav-text">{{ route.meta?.title }}</span>
        </router-link>
      </nav>

      <div class="system-status">
        <div class="status-indicator" :class="systemStatusClass"></div>
        <span class="status-text">{{ systemStatusText }}</span>
        <span class="update-time">{{ lastUpdateText }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMonitoringStore } from '@/stores/monitoring'
import { formatTimeAgo } from '@/utils/format'

const route = useRoute()
const monitoringStore = useMonitoringStore()

const routes = [
  { name: 'Realtime', path: '/realtime', meta: { title: '实时可视化', icon: '📺' } },
  { name: 'Monitoring', path: '/monitoring', meta: { title: '状态监控', icon: '📊' } },
  { name: 'Configuration', path: '/configuration', meta: { title: '参数配置', icon: '⚙️' } },
  { name: 'Logs', path: '/logs', meta: { title: '系统日志', icon: '📝' } },
  { name: 'Help', path: '/help', meta: { title: '帮助说明', icon: '❓' } }
]

const systemStatusClass = computed(() => {
  if (!monitoringStore.isConnected) return 'status-error'
  if (monitoringStore.systemHealth === 'critical') return 'status-critical'
  if (monitoringStore.systemHealth === 'warning') return 'status-warning'
  return 'status-normal'
})

const systemStatusText = computed(() => {
  if (!monitoringStore.isConnected) return '连接断开'
  if (monitoringStore.systemHealth === 'critical') return '系统异常'
  if (monitoringStore.systemHealth === 'warning') return '系统警告'
  return '系统正常'
})

const lastUpdateText = computed(() => {
  return formatTimeAgo(monitoringStore.lastUpdateTime)
})
</script>

<style scoped>
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid #667eea;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.nav-tabs {
  display: flex;
  gap: 1rem;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #666;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.nav-tab:hover {
  border-color: #667eea;
  color: #667eea;
}

.nav-tab.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.system-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5rem;
}

.status-normal {
  background: #4CAF50;
  animation: pulse 2s infinite;
}

.status-warning {
  background: #FF9800;
  animation: pulse 2s infinite;
}

.status-critical {
  background: #F44336;
  animation: pulse 1s infinite;
}

.status-error {
  background: #9E9E9E;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

.update-time {
  font-size: 0.8rem;
  color: #999;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }

  .logo-text {
    display: none;
  }

  .nav-text {
    display: none;
  }
}
</style>
