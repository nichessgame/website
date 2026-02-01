/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { mdiSwordCross, mdiRobot, mdiInformation, mdiScriptText, mdiGift, mdiWeb, mdiAccountGroup, mdiGithub, mdiYoutube, mdiClose, mdiTools } from '@mdi/js'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      mdiSwordCross: mdiSwordCross,
      mdiInformation: mdiInformation,
      mdiScriptText: mdiScriptText,
      mdiGift: mdiGift,
      mdiWeb: mdiWeb,
      mdiAccountGroup: mdiAccountGroup,
      mdiGithub: mdiGithub,
      mdiYoutube: mdiYoutube,
      mdiRobot: mdiRobot,
      mdiClose: mdiClose,
      mdiTools: mdiTools,
    },
    sets: {
      mdi,
    },
  },
})
