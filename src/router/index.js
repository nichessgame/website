/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'

// Add .html aliases so prerendered pages work at both /rules and /rules.html
const layoutRoutes = setupLayouts([
  ...routes,
  {
    path: '/game/:myColor/:difficulty/:gameId',
    name: 'game',
    component: () => import('../pages/game.vue'),
    props: true
  }
])

for (const route of layoutRoutes) {
  if (route.path && route.path !== '/' && !route.path.includes(':')) {
    route.alias = route.path + '.html'
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: layoutRoutes,
})

// Recording scripts use this board-only page on the local dev server.
// Vite removes this branch and its component from production builds.
if (import.meta.env.DEV) {
  for (const route of setupLayouts([{
    path: '/gamerecorder',
    name: 'gamerecorder',
    component: () => import('../pages/gamerecorder.vue'),
  }])) {
    router.addRoute(route)
  }
}

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
