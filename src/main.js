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

// Head management
import { createHead } from '@unhead/vue/legacy'

// PWA
import { registerSW } from 'virtual:pwa-register'

// Styles
import 'unfonts.css'

registerSW({ immediate: true })

const app = createApp(App)

const head = createHead()
app.use(head)

registerPlugins(app)

app.mount('#app')
