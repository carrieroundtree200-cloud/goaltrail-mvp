import { useOutletContext } from 'react-router-dom'

import type { GoalView } from '@/state/selectors'

/** Every goal tab reads the same computed view from the layout route. */
export function useGoalView(): GoalView {
  return useOutletContext<GoalView>()
}
