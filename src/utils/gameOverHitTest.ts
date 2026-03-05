import { CELL_SIZE, COLUMNS_COUNT, ROWS_COUNT } from '../model/consts'

const WIDTH = CELL_SIZE * COLUMNS_COUNT
const HEIGHT = CELL_SIZE * ROWS_COUNT
const BOX_WIDTH = 220
const BOX_HEIGHT = 140
const BUTTON_WIDTH = 140
const BUTTON_HEIGHT = 44

export const GAME_OVER_RESTART_BOUNDS = {
  left: WIDTH / 2 - BUTTON_WIDTH / 2,
  right: WIDTH / 2 + BUTTON_WIDTH / 2,
  top: HEIGHT / 2 + 20,
  bottom: HEIGHT / 2 + 20 + BUTTON_HEIGHT
}

export const hitTestRestart = (x: number, y: number): boolean => {
  const { left, right, top, bottom } = GAME_OVER_RESTART_BOUNDS
  return x >= left && x <= right && y >= top && y <= bottom
}
