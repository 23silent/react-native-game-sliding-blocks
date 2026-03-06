import { PAUSE_OVERLAY } from '../model/layoutConsts'

const { BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_GAP, FIRST_BUTTON_TOP } =
  PAUSE_OVERLAY

export type PauseOverlayAction = 'resume' | 'restart' | 'finish'

export function hitTestPauseOverlay(
  x: number,
  y: number,
  showFinishOption: boolean,
  gameWidth: number,
  gameHeight: number
): PauseOverlayAction | null {
  const boxLeft = (gameWidth - PAUSE_OVERLAY.BOX_WIDTH) / 2
  const boxTop = (gameHeight - PAUSE_OVERLAY.BOX_HEIGHT) / 2
  const buttonLeft = (gameWidth - BUTTON_WIDTH) / 2

  const resumeTop = boxTop + FIRST_BUTTON_TOP
  const restartTop = resumeTop + BUTTON_HEIGHT + BUTTON_GAP
  const finishTop = restartTop + BUTTON_HEIGHT + BUTTON_GAP

  if (x < buttonLeft || x > buttonLeft + BUTTON_WIDTH) return null
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
