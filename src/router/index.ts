// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/realtime'
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('@/views/MonitoringView.vue'),
    meta: {
      title: '状态监控',
      icon: '📊'
    }
  },
  {
    path: '/realtime',
    name: 'Realtime',
    component: () => import('@/views/RealtimeView.vue'),
    meta: {
      title: '实时可视化',
      icon: '📺'
    }
  },
  {
    path: '/configuration',
    name: 'Configuration',
    component: () => import('@/views/ConfigurationViewV2.vue'),
    meta: {
      title: '参数配置',
      icon: '⚙️'
    }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('@/views/LogsView.vue'),
    meta: {
      title: '系统日志',
      icon: '📝'
    }
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/views/AboutView.vue'),
    meta: {
      title: '帮助说明',
      icon: '❓'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, _from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 感应式单车道动态让行系统`
  }
  next()
})

export default router
