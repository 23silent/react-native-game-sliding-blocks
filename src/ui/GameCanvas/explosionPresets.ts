/**
 * Precomputed presets for explosion particles.
 * All values are plain data for worklet compatibility.
 */

import type { ExplosionPresetsSettings } from '../../types/settings'

/** Seeded pseudo-random for deterministic presets */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

export type TrajectoryParticle = {
  angle: number
  distMult: number
  speedCurve: number
  /** Multiplier for jump arc (up then down); varies per particle */
  arcMult: number
}

export type ShapeParticle = {
  shape: 0 | 1 | 2 | 3
  sizeMult: number
  rotation: number
}

function buildTrajectoryPreset(
  seedBase: number,
  particleCount: number
): TrajectoryParticle[] {
  const r = seeded(seedBase)
  const particles: TrajectoryParticle[] = []
  for (let i = 0; i < particleCount; i++) {
    const angle = r() * Math.PI * 2
    const distMult = 0.6 + r() * 0.8
    const speedCurve = 0.7 + r() * 0.6
    const arcMult = 0.4 + r() * 1.2
    particles.push({ angle, distMult, speedCurve, arcMult })
  }
  return particles
}

function buildShapePreset(
  seedBase: number,
  particleCount: number,
  circlesOnly: boolean
): ShapeParticle[] {
  const r = seeded(seedBase)
  const particles: ShapeParticle[] = []
  for (let i = 0; i < particleCount; i++) {
    const shape = circlesOnly
      ? (0 as const)
      : (Math.floor(r() * 4) as 0 | 1 | 2 | 3)
    const sizeMult = 0.5 + r() * 1.2
    const rotation = r() * Math.PI * 2
    particles.push({ shape, sizeMult, rotation })
  }
  return particles
}

export type ExplosionPresets = {
  trajectoryPresets: TrajectoryParticle[][]
  shapePresets: ShapeParticle[][]
  particleCount: number
  presetCount: number
}

export function buildExplosionPresets(
  config: ExplosionPresetsSettings
): ExplosionPresets {
  const {
    particleCount,
    trajectoryPresetCount,
    shapePresetCount,
    circlesOnly = false
  } = config

  const trajectoryPresets = Array.from(
    { length: trajectoryPresetCount },
    (_, i) => buildTrajectoryPreset(1000 + i * 7919, particleCount)
  )
  const shapePresets = Array.from(
    { length: shapePresetCount },
    (_, i) =>
      buildShapePreset(2000 + i * 7919, particleCount, circlesOnly)
  )
  return {
    trajectoryPresets,
    shapePresets,
    particleCount,
    presetCount: Math.max(trajectoryPresetCount, shapePresetCount)
  }
}
