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

import type { BlockMap } from '../../../engine'
import type { BlockSettings } from '../../../types'
import type { BlockTheme } from '../../SlidingBlocks.types'
import { DEFAULT_SLIDING_BLOCKS_THEME } from '../../SlidingBlocks.types'

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
  /** Block settings (radius, borderWidth, etc.). Pass from parent so component works in Skia Canvas tree. */
  blockSettings?: BlockSettings
  /** Block theme (borderColor, superGradientColors). Pass from parent so component works in Skia Canvas tree. */
  blockTheme?: BlockTheme
}

/**
 * Renders a block at slot position.
 * Receives blockSettings and blockTheme via props so it works inside Skia Canvas tree.
 */
export function BlockImage({
  slot,
  block,
  cellSize,
  useSkiaDrawing = false,
  blockSettings: blockSettingsProp,
  blockTheme: blockThemeProp
}: Props): React.JSX.Element {
  const defaultBlock = DEFAULT_SLIDING_BLOCKS_THEME.block
  const blockSettings = blockSettingsProp ?? {
    radius: 12,
    borderWidth: 1,
    borderColor: defaultBlock.borderColor,
    frostHighlightColor: 'rgba(255,255,255,0.05)',
    frostHighlightHeightRatio: 0.25,
    superGradientColors: defaultBlock.superGradientColors,
    superGradientSteps: 20
  }
  const blockTheme = blockThemeProp ?? defaultBlock
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
      const gradColors = blockTheme.superGradientColors
      const [c1, c2] =
        gradColors.length >= 2
          ? gradColors
          : ([[120, 0, 255], [255, 180, 0]] as [number, number, number][])
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

    strokePaint.setColor(Skia.Color(blockTheme.borderColor))
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
    strokePaint,
    blockSettings,
    blockTheme
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
