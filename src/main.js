/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// PWA
import { registerSW } from 'virtual:pwa-register'

// Styles
import 'unfonts.css'

registerSW({ immediate: true })

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
