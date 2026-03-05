import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error('CanvasErrorBoundary:', error, errorInfo)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Something went wrong</Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.error}>{this.state.error.message}</Text>
          )}
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a'
  },
  text: {
    color: '#fff',
    fontSize: 18
  },
  error: {
    color: '#f44',
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 16
  }
})
