import { Group, Picture, Skia } from '@shopify/react-native-skia'
import React, { memo, useMemo } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import type { ExplosionPoolSlotSharedValues } from '../../engine/useSharedValuesMap'

const PARTICLE_COUNT = 16
const EXPLOSION_RADIUS = 60
const PARTICLE_SIZE = 5
const PICTURE_SIZE = 160
const CENTER = PICTURE_SIZE / 2

type Props = {
  slot: ExplosionPoolSlotSharedValues
}

/**
 * Renders a particle explosion from a pool slot.
 * Uses Skia Picture API + useDerivedValue - all drawing on UI thread, no React commits.
 */
export const GameCanvasExplosion = memo(function GameCanvasExplosion({
  slot
}: Props): React.JSX.Element {
  const paint = useMemo(() => Skia.Paint(), [])
  const recorder = useMemo(() => Skia.PictureRecorder(), [])

  const picture = useDerivedValue(() => {
    'worklet'
    const progress = slot.progress.value
    const canvas = recorder.beginRecording(
      Skia.XYWHRect(0, 0, PICTURE_SIZE, PICTURE_SIZE)
    )

    if (progress > 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (i / PARTICLE_COUNT) * 2 * Math.PI
        const distance = progress * EXPLOSION_RADIUS
        const cx = CENTER + Math.cos(angle) * distance
        const cy = CENTER + Math.sin(angle) * distance
        const alpha = (1 - progress) * 0.9
        paint.setColor(Skia.Color(slot.color.value))
        paint.setAlphaf(alpha)
        canvas.drawCircle(cx, cy, PARTICLE_SIZE, paint)
      }
    }

    return recorder.finishRecordingAsPicture()
  }, [slot, recorder, paint])

  const transform = useDerivedValue(
    () => [
      { translateX: slot.centerX.value - CENTER },
      { translateY: slot.centerY.value - CENTER }
    ],
    [slot]
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
