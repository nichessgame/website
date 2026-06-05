import { watch } from 'vue'
import { useAppStore } from '@/stores/app'

export function useBoardDisplaySettings(boardConfig) {
  const appStore = useAppStore()

  watch(
    () => appStore.selectedHealthTextTheme,
    theme => {
      boardConfig.healthText = {
        ...(boardConfig.healthText || {}),
        visible: true,
        theme,
      }
    },
    { immediate: true }
  )
}
