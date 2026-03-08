import React, { useCallback, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSettings } from '../hooks/useSettings'
import {
  getActivePreset,
  getPerformancePresetOverrides,
  type PerformancePreset
} from '../settings'
import { settingsViewModel } from '../settings'
import {
  INPUT_BORDER,
  MENU_BG,
  PANEL_BG,
  RESET_BUTTON_BG,
  RESET_BUTTON_TEXT,
  TEXT_HINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY
} from '../theme'

type Props = {
  onBack: () => void
}

function SettingRow({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

function NumericInput({
  value,
  onChange
}: {
  value: number
  onChange: (v: number) => void
}) {
  const handleChange = useCallback(
    (text: string) => {
      const n = parseFloat(text)
      if (!Number.isNaN(n) && n >= 0) onChange(n)
    },
    [onChange]
  )
  return (
    <TextInput
      style={styles.input}
      value={String(value)}
      onChangeText={handleChange}
      keyboardType="numeric"
      selectTextOnFocus
    />
  )
}

export function SettingsScreen({ onBack }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const settings = useSettings()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const update = useCallback(
    (overrides: Parameters<typeof settingsViewModel.update>[0]) => {
      settingsViewModel.update(overrides)
    },
    []
  )

  const reset = useCallback(async () => {
    await settingsViewModel.reset()
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        onPress={onBack}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Settings</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Performance presets - main */}
        <View style={styles.mainSection}>
          <Text style={styles.sectionTitle}>Performance preset</Text>
          <Text style={styles.hint}>
            One-tap presets for block style, explosion, and animations.
          </Text>
          <View style={[styles.performanceModeRow, styles.presetRow]}>
            {(['extra-low', 'low', 'fine', 'good'] as PerformancePreset[]).map(
              preset => {
                const isActive = getActivePreset(settings) === preset
                return (
                  <Pressable
                    key={preset}
                    style={[
                      styles.presetButton,
                      isActive && styles.presetButtonActive
                    ]}
                    onPress={() =>
                      update(getPerformancePresetOverrides(preset))
                    }
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        isActive && styles.presetButtonTextActive
                      ]}
                    >
                      {preset === 'extra-low'
                        ? 'Extra low'
                        : preset === 'low'
                          ? 'Low'
                          : preset === 'fine'
                            ? 'Fine'
                            : 'Good'}
                    </Text>
                  </Pressable>
                )
              }
            )}
          </View>
          <Text style={styles.performanceModeHint}>
            Extra low: no animations. Low: no explosion. Fine: explosion mid.
            Good: explosion full, skia.
          </Text>
        </View>

        {/* Advanced toggle */}
        <Pressable
          style={({ pressed }) => [
            styles.advancedButton,
            pressed && styles.pressed
          ]}
          onPress={() => setShowAdvanced(v => !v)}
        >
          <Text style={styles.advancedButtonText}>
            {showAdvanced ? '− Hide custom settings' : '+ Custom settings'}
          </Text>
        </Pressable>

        {showAdvanced && (
          <>
            {/* Block render mode */}
            <Text style={styles.sectionTitle}>Block style</Text>
            <SettingRow label="Rendering">
              <View style={styles.performanceModeRow}>
                <Pressable
                  style={[
                    styles.performanceModeButton,
                    settings.blockRenderMode === 'image' &&
                      styles.performanceModeButtonActive
                  ]}
                  onPress={() => update({ blockRenderMode: 'image' })}
                >
                  <Text
                    style={[
                      styles.performanceModeText,
                      settings.blockRenderMode === 'image' &&
                        styles.performanceModeTextActive
                    ]}
                  >
                    Image
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.performanceModeButton,
                    settings.blockRenderMode === 'skia' &&
                      styles.performanceModeButtonActive
                  ]}
                  onPress={() => update({ blockRenderMode: 'skia' })}
                >
                  <Text
                    style={[
                      styles.performanceModeText,
                      settings.blockRenderMode === 'skia' &&
                        styles.performanceModeTextActive
                    ]}
                  >
                    Skia
                  </Text>
                </Pressable>
              </View>
            </SettingRow>
            <Text style={styles.hint}>
              Image: PNG assets. Skia: drawn blocks (no assets).
            </Text>

            {/* Block */}
            <Text style={styles.sectionTitle}>Block</Text>
            <SettingRow label="Radius">
              <NumericInput
                value={settings.block.radius}
                onChange={v => update({ block: { radius: v } })}
              />
            </SettingRow>
            <SettingRow label="Border width">
              <NumericInput
                value={settings.block.borderWidth}
                onChange={v => update({ block: { borderWidth: v } })}
              />
            </SettingRow>
            <SettingRow label="Border color">
              <TextInput
                style={[styles.input, styles.inputWide]}
                value={settings.block.borderColor}
                onChangeText={t => update({ block: { borderColor: t } })}
                placeholder="rgba(r,g,b,a)"
              />
            </SettingRow>
            <SettingRow label="Super gradient steps">
              <NumericInput
                value={settings.block.superGradientSteps}
                onChange={v => update({ block: { superGradientSteps: v } })}
              />
            </SettingRow>
            <SettingRow label="Frost highlight color">
              <TextInput
                style={[styles.input, styles.inputWide]}
                value={settings.block.frostHighlightColor}
                onChangeText={t =>
                  update({ block: { frostHighlightColor: t } })
                }
                placeholder="rgba(r,g,b,a)"
              />
            </SettingRow>
            <SettingRow label="Frost highlight height ratio">
              <NumericInput
                value={settings.block.frostHighlightHeightRatio}
                onChange={v =>
                  update({ block: { frostHighlightHeightRatio: v } })
                }
              />
            </SettingRow>

            {/* Explosion */}
            <Text style={styles.sectionTitle}>Explosion</Text>
            <SettingRow label="Explosion enabled">
              <View style={styles.performanceModeRow}>
                <Pressable
                  style={[
                    styles.performanceModeButton,
                    settings.explosionPresets.explosionEnabled !== false &&
                      styles.performanceModeButtonActive
                  ]}
                  onPress={() =>
                    update({
                      explosionPresets: { explosionEnabled: true }
                    })
                  }
                >
                  <Text
                    style={[
                      styles.performanceModeText,
                      settings.explosionPresets.explosionEnabled !== false &&
                        styles.performanceModeTextActive
                    ]}
                  >
                    On
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.performanceModeButton,
                    settings.explosionPresets.explosionEnabled === false &&
                      styles.performanceModeButtonActive
                  ]}
                  onPress={() =>
                    update({
                      explosionPresets: { explosionEnabled: false }
                    })
                  }
                >
                  <Text
                    style={[
                      styles.performanceModeText,
                      settings.explosionPresets.explosionEnabled === false &&
                        styles.performanceModeTextActive
                    ]}
                  >
                    Off
                  </Text>
                </Pressable>
              </View>
            </SettingRow>
            <SettingRow label="Radius">
              <NumericInput
                value={settings.explosion.radius}
                onChange={v => update({ explosion: { radius: v } })}
              />
            </SettingRow>
            <SettingRow label="Particle size">
              <NumericInput
                value={settings.explosion.baseParticleSize}
                onChange={v => update({ explosion: { baseParticleSize: v } })}
              />
            </SettingRow>
            <SettingRow label="Rise height">
              <NumericInput
                value={settings.explosion.riseHeight}
                onChange={v => update({ explosion: { riseHeight: v } })}
              />
            </SettingRow>
            <SettingRow label="Fall distance">
              <NumericInput
                value={settings.explosion.fallDistance}
                onChange={v => update({ explosion: { fallDistance: v } })}
              />
            </SettingRow>
            <SettingRow label="Picture size">
              <NumericInput
                value={settings.explosion.pictureSize}
                onChange={v => update({ explosion: { pictureSize: v } })}
              />
            </SettingRow>

            {/* Checkerboard */}
            <Text style={styles.sectionTitle}>Checkerboard</Text>
            <SettingRow label="Base color">
              <TextInput
                style={[styles.input, styles.inputWide]}
                value={settings.checkerboard.defaultBaseColor}
                onChangeText={t =>
                  update({
                    checkerboard: { defaultBaseColor: t }
                  })
                }
              />
            </SettingRow>
            <SettingRow label="Dark opacity">
              <NumericInput
                value={settings.checkerboard.defaultDarkOpacity}
                onChange={v =>
                  update({
                    checkerboard: { defaultDarkOpacity: v }
                  })
                }
              />
            </SettingRow>
            <SettingRow label="Light opacity">
              <NumericInput
                value={settings.checkerboard.defaultLightOpacity}
                onChange={v =>
                  update({
                    checkerboard: { defaultLightOpacity: v }
                  })
                }
              />
            </SettingRow>

            {/* Explosion presets */}
            <Text style={styles.sectionTitle}>Explosion Presets</Text>
            <SettingRow label="Particle count">
              <NumericInput
                value={settings.explosionPresets.particleCount}
                onChange={v =>
                  update({
                    explosionPresets: { particleCount: v }
                  })
                }
              />
            </SettingRow>
            <SettingRow label="Trajectory presets">
              <NumericInput
                value={settings.explosionPresets.trajectoryPresetCount}
                onChange={v =>
                  update({
                    explosionPresets: {
                      trajectoryPresetCount: v
                    }
                  })
                }
              />
            </SettingRow>
            <SettingRow label="Shape presets">
              <NumericInput
                value={settings.explosionPresets.shapePresetCount}
                onChange={v =>
                  update({
                    explosionPresets: {
                      shapePresetCount: v
                    }
                  })
                }
              />
            </SettingRow>
            <SettingRow label="Circles only">
              <View style={styles.performanceModeCol}>
                <View style={styles.performanceModeRow}>
                  <Pressable
                    style={[
                      styles.performanceModeButton,
                      settings.explosionPresets.circlesOnly !== true &&
                        styles.performanceModeButtonActive
                    ]}
                    onPress={() =>
                      update({
                        explosionPresets: { circlesOnly: false }
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.performanceModeText,
                        settings.explosionPresets.circlesOnly !== true &&
                          styles.performanceModeTextActive
                      ]}
                    >
                      Mixed shapes
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.performanceModeButton,
                      settings.explosionPresets.circlesOnly === true &&
                        styles.performanceModeButtonActive
                    ]}
                    onPress={() =>
                      update({
                        explosionPresets: { circlesOnly: true }
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.performanceModeText,
                        settings.explosionPresets.circlesOnly === true &&
                          styles.performanceModeTextActive
                      ]}
                    >
                      Circles only
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.performanceModeHint}>
                  Circles only: faster on low-end devices.
                </Text>
              </View>
            </SettingRow>

            {/* Animations */}
            <Text style={styles.sectionTitle}>Animations (ms)</Text>
            <SettingRow label="Complete snap">
              <NumericInput
                value={settings.animations.completeSnapMs}
                onChange={v => update({ animations: { completeSnapMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Item drop">
              <NumericInput
                value={settings.animations.itemDropMs}
                onChange={v => update({ animations: { itemDropMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Will remove pulse">
              <NumericInput
                value={settings.animations.willRemovePulseMs}
                onChange={v => update({ animations: { willRemovePulseMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Remove fade (block opacity)">
              <NumericInput
                value={settings.animations.removeFadeMs}
                onChange={v => update({ animations: { removeFadeMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Remove explosion (particles)">
              <NumericInput
                value={settings.animations.removeExplosionMs}
                onChange={v => update({ animations: { removeExplosionMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Game over in">
              <NumericInput
                value={settings.animations.gameOverInMs}
                onChange={v => update({ animations: { gameOverInMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Game over out">
              <NumericInput
                value={settings.animations.gameOverOutMs}
                onChange={v => update({ animations: { gameOverOutMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Pause overlay">
              <NumericInput
                value={settings.animations.pauseOverlayMs}
                onChange={v => update({ animations: { pauseOverlayMs: v } })}
              />
            </SettingRow>
            <SettingRow label="Loading bar fill">
              <NumericInput
                value={settings.animations.loadingBarFillMs}
                onChange={v => update({ animations: { loadingBarFillMs: v } })}
              />
            </SettingRow>

            {/* Feedback (opacity) */}
            <Text style={styles.sectionTitle}>Feedback (opacity 0–1)</Text>
            <SettingRow label="Block idle">
              <NumericInput
                value={settings.feedback.blockIdle}
                onChange={v => update({ feedback: { blockIdle: v } })}
              />
            </SettingRow>
            <SettingRow label="Will remove pulse min">
              <NumericInput
                value={settings.feedback.willRemovePulseMin}
                onChange={v => update({ feedback: { willRemovePulseMin: v } })}
              />
            </SettingRow>
            <SettingRow label="Ghost active">
              <NumericInput
                value={settings.feedback.ghostActive}
                onChange={v => update({ feedback: { ghostActive: v } })}
              />
            </SettingRow>
            <SettingRow label="Indicator active">
              <NumericInput
                value={settings.feedback.indicatorActive}
                onChange={v => update({ feedback: { indicatorActive: v } })}
              />
            </SettingRow>

            {/* Game layout */}
            <Text style={styles.sectionTitle}>Game Layout</Text>
            <Text style={styles.hint}>Changes apply on next game start</Text>
            <SettingRow label="Rows">
              <NumericInput
                value={settings.gameLayout.rowsCount}
                onChange={v => update({ gameLayout: { rowsCount: v } })}
              />
            </SettingRow>
            <SettingRow label="Columns">
              <NumericInput
                value={settings.gameLayout.columnsCount}
                onChange={v => update({ gameLayout: { columnsCount: v } })}
              />
            </SettingRow>
            <SettingRow label="Padding">
              <NumericInput
                value={settings.gameLayout.padding}
                onChange={v => update({ gameLayout: { padding: v } })}
              />
            </SettingRow>
            <SettingRow label="Explosion pool size">
              <NumericInput
                value={settings.gameLayout.explosionPoolSize}
                onChange={v =>
                  update({
                    gameLayout: { explosionPoolSize: v }
                  })
                }
              />
            </SettingRow>
            <SettingRow label="Keys size">
              <NumericInput
                value={settings.gameLayout.keysSize}
                onChange={v => update({ gameLayout: { keysSize: v } })}
              />
            </SettingRow>

            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.pressed
              ]}
              onPress={reset}
            >
              <Text style={styles.resetText}>Reset to defaults</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MENU_BG,
    paddingHorizontal: 24
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 24
  },
  pressed: {
    opacity: 0.7
  },
  backText: {
    fontSize: 16,
    color: TEXT_SECONDARY
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 16
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 48
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginTop: 20,
    marginBottom: 8
  },
  hint: {
    fontSize: 12,
    color: TEXT_HINT,
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  label: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    flex: 1
  },
  input: {
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: TEXT_PRIMARY,
    minWidth: 72,
    textAlign: 'right'
  },
  inputWide: {
    minWidth: 140,
    textAlign: 'left'
  },
  resetButton: {
    marginTop: 32,
    paddingVertical: 14,
    backgroundColor: RESET_BUTTON_BG,
    borderRadius: 10,
    alignItems: 'center'
  },
  resetText: {
    fontSize: 16,
    color: RESET_BUTTON_TEXT,
    fontWeight: '600'
  },
  mainSection: {
    marginBottom: 20
  },
  performanceModeCol: {
    alignItems: 'flex-end'
  },
  performanceModeRow: {
    flexDirection: 'row',
    gap: 8
  },
  presetRow: {
    flexWrap: 'wrap',
    gap: 10
  },
  presetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY
  },
  presetButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.15)'
  },
  presetButtonTextActive: {
    color: '#3b82f6'
  },
  advancedButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    marginBottom: 20
  },
  advancedButtonText: {
    fontSize: 15,
    color: TEXT_SECONDARY
  },
  performanceModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    backgroundColor: PANEL_BG
  },
  performanceModeButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.15)'
  },
  performanceModeText: {
    fontSize: 13,
    color: TEXT_SECONDARY
  },
  performanceModeTextActive: {
    color: '#3b82f6',
    fontWeight: '600'
  },
  performanceModeHint: {
    fontSize: 11,
    color: TEXT_HINT,
    marginTop: 4
  }
})
