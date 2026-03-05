import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { CanvasErrorBoundary } from './components/CanvasErrorBoundary'
import { GameRootView } from './components/GameRootView'

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CanvasErrorBoundary>
          <GameRootView />
        </CanvasErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
