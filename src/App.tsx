import React, { useCallback, useEffect, useState } from 'react'
import { BackHandler } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { CanvasErrorBoundary } from './components/CanvasErrorBoundary'
import type { Route } from './navigation/types'
import { settingsViewModel } from './settings'
import { ComposableGameScreen } from './screens/ComposableGameScreen'
import { GameScreen } from './screens/GameScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ScoreBoardScreen } from './screens/ScoreBoardScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SplashScreen } from './screens/SplashScreen'

function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>('splash')

  const goHome = useCallback(() => setRoute('home'), [])

  useEffect(() => {
    settingsViewModel.init()
  }, [])

  useEffect(() => {
    if (route !== 'splash') return
    const t = setTimeout(() => setRoute('home'), 500)
    return () => clearTimeout(t)
  }, [route])

  React.useEffect(() => {
    if (route === 'home' || route === 'splash') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setRoute('home')
      return true
    })
    return () => sub.remove()
  }, [route])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CanvasErrorBoundary>
          {route === 'splash' && <SplashScreen />}
          {route === 'home' && (
            <HomeScreen onNavigate={setRoute} />
          )}
          {route === 'game' && (
            <GameScreen onMenuPress={goHome} />
          )}
          {route === 'composable-game' && (
            <ComposableGameScreen onMenuPress={goHome} />
          )}
          {route === 'settings' && (
            <SettingsScreen onBack={goHome} />
          )}
          {route === 'scoreboard' && (
            <ScoreBoardScreen onBack={goHome} />
          )}
        </CanvasErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
