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
    component: () => import('@/views/MonitoringViewV2.vue'),
    meta: {
      title: '监控',
      icon: '📊'
    }
  },
  {
    path: '/realtime',
    name: 'Realtime',
    component: () => import('@/views/RealtimeView.vue'),
    meta: {
      title: '实时状态',
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
  // 新增：车辆测试页面路由（固定连接，不在导航中显示）
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/TestView.vue'),
    meta: {
      title: '车辆测试',
      icon: '🚗',
      hidden: true // 标记为隐藏，不在导航中显示
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
