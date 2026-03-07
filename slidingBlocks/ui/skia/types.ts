/**
 * Generic slot interfaces for core/skia presets.
 * Implement these so presets work with any component.
 *
 * Each interface is minimal: only the SharedValues needed for the preset.
 */

/** Any object with a numeric SharedValue */
export type SharedNumber = { value: number }

/** Any object with a boolean SharedValue */
export type SharedBoolean = { value: boolean }

/** Slot that has translateX (for position sync) */
export type HasTranslateX = { translateX: SharedNumber }

/** Slot that has opacity (for fade effects) */
export type HasOpacity = { opacity: SharedNumber }

/** Slot used for gesture sync: translateX, isActive, initialLeft */
export type GestureSlot = HasTranslateX & {
  isActive: SharedBoolean
  initialLeft: SharedNumber
}

/** Source of gesture translation (e.g. Pan gesture changeX) */
export type GestureSource = SharedNumber
