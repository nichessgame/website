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
import { mdiSwordCross, mdiLightningBolt, mdiRobot, mdiInformation, mdiScriptText, mdiGift, mdiWeb, mdiAccountGroup, mdiGithub, mdiYoutube, mdiClose, mdiTools, mdiCog, mdiChevronLeft, mdiChevronRight, mdiChevronDoubleLeft, mdiChevronDoubleRight, mdiPause, mdiPlay, mdiUpload, mdiAlertCircle, mdiCheckCircle, mdiContentCopy, mdiVolumeHigh, mdiVolumeOff, mdiRotate3dVariant, mdiDelete, mdiLaptop, mdiRefresh } from '@mdi/js'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      // Keep in sync with the accent and status colors in styles/site.css
      dark: {
        colors: {
          'primary': '#8bb5ff',
          'info': '#8bb5ff',
          'success': '#66bb6a',
          'error': '#ef5350',
          'warning': '#ffb74d',
          // Switch thumb (Vuetify's default is lavender)
          'surface-bright': '#f1f3f6',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      mdiSwordCross: mdiSwordCross,
      mdiLightningBolt: mdiLightningBolt,
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
      mdiCog: mdiCog,
      mdiChevronLeft: mdiChevronLeft,
      mdiChevronRight: mdiChevronRight,
      mdiChevronDoubleLeft: mdiChevronDoubleLeft,
      mdiChevronDoubleRight: mdiChevronDoubleRight,
      mdiPause: mdiPause,
      mdiPlay: mdiPlay,
      mdiUpload: mdiUpload,
      mdiAlertCircle: mdiAlertCircle,
      mdiCheckCircle: mdiCheckCircle,
      mdiContentCopy: mdiContentCopy,
      mdiVolumeHigh: mdiVolumeHigh,
      mdiVolumeOff: mdiVolumeOff,
      mdiRotate3dVariant: mdiRotate3dVariant,
      mdiDelete: mdiDelete,
      mdiLaptop: mdiLaptop,
      mdiRefresh: mdiRefresh,
    },
    sets: {
      mdi,
    },
  },
})
