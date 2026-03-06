import { Group, Picture, Skia } from '@shopify/react-native-skia'
import React, { memo, useMemo } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { useSettings } from '../../../hooks/useSettings'

type Props = {
  rows: number
  cols: number
  cellSize: number
  baseColor?: string
  /** Opacity for dark cells (odd row + even col, or even row + odd col) */
  darkOpacity?: number
  /** Opacity for light cells */
  lightOpacity?: number
}

/**
 * Renders a checkerboard grid pattern as a single Skia Picture.
 * Drawing happens on the UI thread in a worklet - no 80 React nodes, no JS-thread render cost.
 */
export const CheckerboardGrid = memo(function CheckerboardGrid({
  rows,
  cols,
  cellSize,
  baseColor: baseColorProp,
  darkOpacity: darkOpacityProp,
  lightOpacity: lightOpacityProp
}: Props): React.JSX.Element {
  const { checkerboard } = useSettings()
  const baseColor = baseColorProp ?? checkerboard.defaultBaseColor
  const darkOpacity = darkOpacityProp ?? checkerboard.defaultDarkOpacity
  const lightOpacity = lightOpacityProp ?? checkerboard.defaultLightOpacity
  const paint = useMemo(() => Skia.Paint(), [])
  const recorder = useMemo(() => Skia.PictureRecorder(), [])

  const picture = useDerivedValue(() => {
    'worklet'
    const width = cols * cellSize
    const height = rows * cellSize
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height))

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const opacity =
          rowIndex % 2
            ? colIndex % 2
              ? darkOpacity
              : lightOpacity
            : colIndex % 2
              ? lightOpacity
              : darkOpacity
        paint.setColor(Skia.Color(baseColor))
        paint.setAlphaf(opacity)
        canvas.drawRect(
          Skia.XYWHRect(
            colIndex * cellSize,
            rowIndex * cellSize,
            cellSize,
            cellSize
          ),
          paint
        )
      }
    }

    return recorder.finishRecordingAsPicture()
  }, [
    rows,
    cols,
    cellSize,
    baseColor,
    darkOpacity,
    lightOpacity,
    recorder,
    paint
  ])

  return (
    <Group>
      <Picture picture={picture} />
    </Group>
  )
})
