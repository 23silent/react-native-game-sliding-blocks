import { Group, Picture, Skia } from '@shopify/react-native-skia'
import React, { memo, useMemo } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import type { ExplosionPoolSlotSharedValues } from '../../engine/useSharedValuesMap'
import { useSettings } from '../../hooks/useSettings'
import { buildExplosionPresets } from './explosionPresets'

type Props = {
  slot: ExplosionPoolSlotSharedValues
  slotIndex: number
}

/**
 * Renders a particle explosion from a pool slot.
 * Block-breaking effect: small debris bursts up briefly, then falls to the bottom.
 * Each cell of a multi-cell block gets its own explosion (triggered per-cell in engine bridge).
 */
export const GameCanvasExplosion = memo(function GameCanvasExplosion({
  slot,
  slotIndex
}: Props): React.JSX.Element {
  const { explosion: explosionSettings, explosionPresets: presetsConfig } =
    useSettings()
  const presets = useMemo(
    () => buildExplosionPresets(presetsConfig),
    [
      presetsConfig.particleCount,
      presetsConfig.trajectoryPresetCount,
      presetsConfig.shapePresetCount
    ]
  )

  const {
    radius,
    baseParticleSize,
    riseHeight,
    fallDistance,
    pictureSize
  } = explosionSettings
  const center = pictureSize / 2

  const paint = useMemo(() => Skia.Paint(), [])
  const recorder = useMemo(() => Skia.PictureRecorder(), [])

  const picture = useDerivedValue(() => {
    'worklet'
    const progress = slot.progress.value
    const canvas = recorder.beginRecording(
      Skia.XYWHRect(0, 0, pictureSize, pictureSize)
    )

    if (progress > 0) {
      const trajPreset =
        presets.trajectoryPresets[slotIndex % presets.trajectoryPresets.length]
      const shapePreset =
        presets.shapePresets[slotIndex % presets.shapePresets.length]
      const color = slot.color.value

      for (let i = 0; i < presets.particleCount; i++) {
        const traj = trajPreset[i] ?? trajPreset[0]
        const shape = shapePreset[i] ?? shapePreset[0]

        const easedProgress = 1 - Math.pow(1 - progress, traj.speedCurve)
        const distance = easedProgress * radius * traj.distMult
        const cx = center + Math.cos(traj.angle) * distance
        const baseCy = center + Math.sin(traj.angle) * distance
        const rise = -Math.sin(progress * Math.PI) * riseHeight * traj.arcMult
        const fall = progress * progress * fallDistance * traj.arcMult
        const cy = baseCy + rise + fall

        const alpha = (1 - progress) * 0.92
        const sizeScale = Math.pow(progress, 0.6) * (1 - progress * 0.4)
        const size = baseParticleSize * shape.sizeMult * sizeScale

        paint.setColor(Skia.Color(color))
        paint.setAlphaf(alpha)

        const half = size / 2
        const rect = Skia.XYWHRect(cx - half, cy - half, size, size)

        if (shape.shape === 0) {
          canvas.drawCircle(cx, cy, size / 2, paint)
        } else if (shape.shape === 1) {
          canvas.drawRect(rect, paint)
        } else if (shape.shape === 2) {
          const rrect = Skia.RRectXY(rect, size * 0.3, size * 0.3)
          canvas.drawRRect(rrect, paint)
        } else {
          const path = Skia.Path.Make()
          const r = size / 2
          for (let v = 0; v < 4; v++) {
            const a = (v / 4) * Math.PI * 2 + shape.rotation
            const px = cx + Math.cos(a) * r
            const py = cy + Math.sin(a) * r
            if (v === 0) path.moveTo(px, py)
            else path.lineTo(px, py)
          }
          path.close()
          canvas.drawPath(path, paint)
        }
      }
    }

    return recorder.finishRecordingAsPicture()
  }, [
    slot,
    slotIndex,
    recorder,
    paint,
    presets,
    radius,
    baseParticleSize,
    riseHeight,
    fallDistance,
    pictureSize,
    center
  ])

  const transform = useDerivedValue(
    () => [
      { translateX: slot.centerX.value - center },
      { translateY: slot.centerY.value - center }
    ],
    [slot, center]
  )

  const opacity = useDerivedValue(
    () => (slot.progress.value > 0 ? 1 : 0),
    [slot]
  )

  return (
    <Group transform={transform} opacity={opacity}>
      <Picture picture={picture} />
    </Group>
  )
})
