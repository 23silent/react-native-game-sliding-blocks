import { GAME_OVER_OVERLAY } from '../model/layoutConsts'

const { BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_TOP_OFFSET } = GAME_OVER_OVERLAY

export function getGameOverRestartBounds(
  gameWidth: number,
  gameHeight: number
): { left: number; right: number; top: number; bottom: number } {
  return {
    left: gameWidth / 2 - BUTTON_WIDTH / 2,
    right: gameWidth / 2 + BUTTON_WIDTH / 2,
    top: gameHeight / 2 + BUTTON_TOP_OFFSET,
    bottom: gameHeight / 2 + BUTTON_TOP_OFFSET + BUTTON_HEIGHT
  }
}

export const hitTestRestart = (
  x: number,
  y: number,
  gameWidth: number,
  gameHeight: number
): boolean => {
  const bounds = getGameOverRestartBounds(gameWidth, gameHeight)
  return (
    x >= bounds.left &&
    x <= bounds.right &&
    y >= bounds.top &&
    y <= bounds.bottom
  )
}
