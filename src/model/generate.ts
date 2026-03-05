import { COLUMNS_COUNT } from './consts'
import type { PathSegment } from './types'

function generateUniqueId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`
}

export const generateSegmentsWithGaps = (): PathSegment[] => {
  const baseColors = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF'
  ]
  const lineLength = COLUMNS_COUNT
  const segments: PathSegment[] = []
  let currentStart = 0

  while (currentStart < lineLength) {
    if (Math.random() < 0.5 && currentStart < lineLength - 1) {
      const gapSize = Math.floor(Math.random() * 2) + 1
      currentStart += gapSize
      if (currentStart >= lineLength) break
    }

    const segmentLength = Math.floor(Math.random() * 4) + 1
    const start = currentStart
    const end = Math.min(start + segmentLength, lineLength)
    if (start >= end) break

    const color = baseColors[Math.floor(Math.random() * baseColors.length)]
    const id = generateUniqueId()
    const isSuper = Math.random() < 0.05

    segments.push({
      id,
      start,
      end,
      color: isSuper ? '#000' : color,
      super: isSuper
    })
    currentStart = end
  }

  return segments
}
