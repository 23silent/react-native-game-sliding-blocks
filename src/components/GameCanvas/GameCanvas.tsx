import {
  Canvas,
  Fill,
  Group,
  Image,
  Rect,
  RoundedRect,
  Text,
  useImage
} from '@shopify/react-native-skia'
import React, { memo } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import {
  CELL_SIZE,
  COLUMNS_COUNT,
  KEYS,
  ROWS_COUNT
} from '../../model/consts'
import { fonts } from '../../utils/fonts'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'
import { GameCanvasGhost } from './GameCanvasGhost'
import { GameCanvasIndicator } from './GameCanvasIndicator'
import { GameCanvasItem } from './GameCanvasItem'
import { GameOverOverlay } from './GameOverOverlay'
import type { BlockMap } from '../../model/types'

const GAME_WIDTH = CELL_SIZE * COLUMNS_COUNT
const GAME_HEIGHT = CELL_SIZE * ROWS_COUNT

export type GameLayout = {
  contentTop: number
  gameAreaX: number
  gameAreaY: number
  actionsBarLeft: number
  actionsBarWidth: number
}

type GameCanvasProps = {
  shared: SharedValuesMap
  layout: GameLayout
  block: BlockMap
  screenWidth: number
  screenHeight: number
}

export const GameCanvas = memo(function GameCanvas({
  shared,
  layout,
  block,
  screenWidth,
  screenHeight
}: GameCanvasProps): React.JSX.Element {
  const bgImage = useImage(require('../../assets/bg.jpg'))

  const scoreText = useDerivedValue(() => `${Math.round(shared.score.value)}`)
  const multiplierText = useDerivedValue(
    () => `${Math.round(shared.multiplier.value)}`
  )

  return (
    <Canvas style={{ flex: 1 }}>
      {bgImage ? (
        <Image
          image={bgImage}
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          fit="cover"
        />
      ) : (
        <Fill color="rgba(200,200,200,0.5)" />
      )}
      <Fill color="rgba(255,255,255,0.3)" />
      <Group transform={[{ translateY: layout.contentTop }]}>
        <RoundedRect
          x={layout.actionsBarLeft}
          y={0}
          width={layout.actionsBarWidth}
          height={50}
          r={10}
          color="rgba(0,0,0,0.4)"
        />
        <Text
          text="Restart"
          font={fonts.button}
          x={layout.actionsBarLeft + 20}
          y={38}
          color="white"
        />
        <Text
          text="Score"
          font={fonts.label}
          x={layout.actionsBarLeft + layout.actionsBarWidth / 2 - 80}
          y={18}
          color="white"
        />
        <Text
          text={scoreText}
          font={fonts.score}
          x={layout.actionsBarLeft + layout.actionsBarWidth / 2 - 60}
          y={42}
          color="white"
        />
        <Text
          text="Multiplier"
          font={fonts.label}
          x={layout.actionsBarLeft + layout.actionsBarWidth / 2 + 10}
          y={18}
          color="white"
        />
        <Text
          text={multiplierText}
          font={fonts.score}
          x={layout.actionsBarLeft + layout.actionsBarWidth / 2 + 30}
          y={42}
          color="white"
        />
      </Group>
      <Group
        transform={[
          { translateX: layout.gameAreaX },
          { translateY: layout.gameAreaY }
        ]}
      >
        <RoundedRect
          x={0}
          y={0}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          r={10}
          color="transparent"
        />
        {/* Grid */}
        {[...new Array(ROWS_COUNT)].map((_, rowIndex) =>
          [...new Array(COLUMNS_COUNT)].map((_, colIndex) => (
            <Rect
              key={`${colIndex}-${rowIndex}`}
              x={colIndex * CELL_SIZE}
              y={rowIndex * CELL_SIZE}
              width={CELL_SIZE}
              height={CELL_SIZE}
              color="rgba(0,0,0,1)"
              opacity={
                rowIndex % 2
                  ? colIndex % 2
                    ? 0.2
                    : 0.3
                  : !(colIndex % 2)
                    ? 0.2
                    : 0.3
              }
            />
          ))
        )}
        {/* Indicator */}
        <GameCanvasIndicator
          indicator={shared.indicator}
          translateX={shared.translateX}
        />
        {/* Ghost */}
        <GameCanvasGhost ghost={shared.ghost} block={block} />
        {KEYS.map(key => (
          <GameCanvasItem
            key={key}
            slot={shared.items[key]}
            translateX={shared.translateX}
            block={block}
          />
        ))}
        {/* Game Over Overlay */}
        <GameOverOverlay
          overlay={shared.overlay}
          gameWidth={GAME_WIDTH}
          gameHeight={GAME_HEIGHT}
        />
      </Group>
    </Canvas>
  )
})
