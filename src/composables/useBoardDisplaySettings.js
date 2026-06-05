import { watch } from 'vue'
import { useAppStore } from '@/stores/app'

export function useBoardDisplaySettings(boardConfig) {
  const appStore = useAppStore()

  watch(
    () => [appStore.selectedPointsTextTheme, appStore.abilityPointsVisible],
    ([theme, abilityPointsVisible]) => {
      boardConfig.healthAndAbilityPointsText = {
        ...(boardConfig.healthAndAbilityPointsText || {}),
        healthPointsVisible: true,
        theme,
        abilityPointsVisible,
      }
    },
    { immediate: true }
  )
}
