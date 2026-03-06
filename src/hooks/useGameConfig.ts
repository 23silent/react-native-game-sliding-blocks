import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

import { useSettings } from './useSettings'
import {
  computeGameConfig,
  type GameConfig
} from '../settings/gameConfig'

export function useGameConfig(): GameConfig {
  const settings = useSettings()
  const { width } = useWindowDimensions()
  const gl = settings.gameLayout
  return useMemo(
    () => computeGameConfig(settings.gameLayout, width),
    [
      gl.rowsCount,
      gl.columnsCount,
      gl.padding,
      gl.keysSize,
      gl.explosionPoolSize,
      width
    ]
  )
}
