import { CELL_SIZE, COLUMNS_COUNT, ROWS_COUNT } from '../model/consts'
import { PAUSE_OVERLAY } from '../model/layoutConsts'

const GAME_WIDTH = CELL_SIZE * COLUMNS_COUNT
const GAME_HEIGHT = CELL_SIZE * ROWS_COUNT
const { BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_GAP, FIRST_BUTTON_TOP } =
  PAUSE_OVERLAY
const BOX_LEFT = (GAME_WIDTH - PAUSE_OVERLAY.BOX_WIDTH) / 2
const BOX_TOP = (GAME_HEIGHT - PAUSE_OVERLAY.BOX_HEIGHT) / 2
const BUTTON_LEFT = (GAME_WIDTH - BUTTON_WIDTH) / 2

const resumeTop = BOX_TOP + FIRST_BUTTON_TOP
const restartTop = resumeTop + BUTTON_HEIGHT + BUTTON_GAP
const finishTop = restartTop + BUTTON_HEIGHT + BUTTON_GAP

export type PauseOverlayAction = 'resume' | 'restart' | 'finish'

export function hitTestPauseOverlay(
  x: number,
  y: number,
  showFinishOption: boolean
): PauseOverlayAction | null {
  if (x < BUTTON_LEFT || x > BUTTON_LEFT + BUTTON_WIDTH) return null
  if (y >= resumeTop && y <= resumeTop + BUTTON_HEIGHT) return 'resume'
  if (y >= restartTop && y <= restartTop + BUTTON_HEIGHT) return 'restart'
  if (
    showFinishOption &&
    y >= finishTop &&
    y <= finishTop + BUTTON_HEIGHT
  ) {
    return 'finish'
  }
  return null
}
