import {
  Group,
  Image,
  Picture,
  Skia,
  type SkImage
} from '@shopify/react-native-skia'
import React, { useMemo } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { useDerivedValue } from 'react-native-reanimated'

import { useSettings } from '../../../hooks/useSettings'
import type { BlockMap } from '../../../model/types'

export type BlockImageSlot = {
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  width: SharedValue<number>
  opacity: SharedValue<number>
  color: SharedValue<string>
}

type Props = {
  slot: BlockImageSlot
  block: BlockMap
  cellSize: number
  /** When true, draw blocks with Skia primitives instead of PNG assets. */
  useSkiaDrawing?: boolean
}

/**
 * Renders a block at slot position.
 * - useSkiaDrawing=false (default): Uses PNG assets from block map (color + size).
 * - useSkiaDrawing=true: Draws via Picture API with correct color and opacity animation.
 * Used by both GameCanvasItem and GameCanvasGhost for consistent block rendering.
 */
export function BlockImage({
  slot,
  block,
  cellSize,
  useSkiaDrawing = false
}: Props): React.JSX.Element {
  const { block: blockSettings } = useSettings()
  const height = cellSize

  const image = useDerivedValue<SkImage | null>(
    () => {
      if (useSkiaDrawing) return null
      const color = slot.color.value
      const size = Math.round(slot.width.value / cellSize)
      return (block?.[color]?.[size - 1] ?? null) as SkImage | null
    },
    [block, useSkiaDrawing, cellSize]
  )

  const fillPaint = useMemo(() => Skia.Paint(), [])
  const frostPaint = useMemo(() => Skia.Paint(), [])
  const strokePaint = useMemo(() => Skia.Paint(), [])
  const recorder = useMemo(() => Skia.PictureRecorder(), [])

  const picture = useDerivedValue(() => {
    'worklet'
    const w = slot.width.value
    const opacity = slot.opacity.value
    const color = slot.color.value
    const isSuper = color === '#000' || color === '#000000'
    const rect = Skia.XYWHRect(0, 0, w, height)
    const rrect = Skia.RRectXY(
      rect,
      blockSettings.radius,
      blockSettings.radius
    )
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, w, height))

    if (isSuper) {
      const path = Skia.Path.Make()
      path.addRRect(rrect)
      canvas.save()
      canvas.clipPath(path, 1, true)
      const [c1, c2] = blockSettings.superGradientColors
      const stepH = height / blockSettings.superGradientSteps
      for (let i = 0; i < blockSettings.superGradientSteps; i++) {
        const t = i / (blockSettings.superGradientSteps - 1)
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
        fillPaint.setColor(Skia.Color(`rgba(${r},${g},${b},${opacity})`))
        const stripRect = Skia.XYWHRect(0, i * stepH, w, stepH + 1)
        canvas.drawRect(stripRect, fillPaint)
      }
      canvas.restore()
    } else {
      fillPaint.setColor(Skia.Color(color))
      fillPaint.setAlphaf(opacity)
      canvas.drawRRect(rrect, fillPaint)
    }

    strokePaint.setColor(Skia.Color(blockSettings.borderColor))
    strokePaint.setAlphaf(opacity)
    strokePaint.setStrokeWidth(blockSettings.borderWidth)
    strokePaint.setStyle(1)
    canvas.drawRRect(rrect, strokePaint)

    return recorder.finishRecordingAsPicture()
  }, [
    slot,
    height,
    recorder,
    fillPaint,
    frostPaint,
    strokePaint,
    blockSettings
  ])

  const skiaTransform = useDerivedValue(
    () => [
      { translateX: slot.translateX.value },
      { translateY: slot.translateY.value }
    ],
    []
  )

  if (useSkiaDrawing) {
    return (
      <Group transform={skiaTransform}>
        <Picture picture={picture} />
      </Group>
    )
  }

  return (
    <Image
      image={image}
      fit="contain"
      x={slot.translateX}
      y={slot.translateY}
      width={slot.width}
      height={height}
      opacity={slot.opacity}
    />
  )
}
