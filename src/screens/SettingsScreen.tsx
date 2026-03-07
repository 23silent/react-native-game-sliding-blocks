import React, { useCallback } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { settingsViewModel } from '../settings'
import { useSettings } from '../hooks/useSettings'
import {
  MENU_BG,
  PANEL_BG,
  RESET_BUTTON_BG,
  RESET_BUTTON_TEXT,
  TEXT_HINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  INPUT_BORDER
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
  onChange,
  min,
  max
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const handleChange = useCallback(
    (text: string) => {
      const n = parseFloat(text)
      if (!Number.isNaN(n)) {
        let v = n
        if (min != null && v < min) v = min
        if (max != null && v > max) v = max
        onChange(v)
      }
    },
    [onChange, min, max]
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

  const update = useCallback((overrides: Parameters<typeof settingsViewModel.update>[0]) => {
    settingsViewModel.update(overrides)
  }, [])

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
        {/* Block */}
        <Text style={styles.sectionTitle}>Block</Text>
        <SettingRow label="Radius">
          <NumericInput
            value={settings.block.radius}
            onChange={v => update({ block: { radius: v } })}
            min={1}
            max={32}
          />
        </SettingRow>
        <SettingRow label="Border width">
          <NumericInput
            value={settings.block.borderWidth}
            onChange={v => update({ block: { borderWidth: v } })}
            min={0}
            max={4}
          />
        </SettingRow>
        <SettingRow label="Border color">
          <TextInput
            style={[styles.input, styles.inputWide]}
            value={settings.block.borderColor}
            onChangeText={t =>
              update({ block: { borderColor: t } })
            }
            placeholder="rgba(r,g,b,a)"
          />
        </SettingRow>
        <SettingRow label="Super gradient steps">
          <NumericInput
            value={settings.block.superGradientSteps}
            onChange={v =>
              update({ block: { superGradientSteps: v } })
            }
            min={2}
            max={50}
          />
        </SettingRow>

        {/* Explosion */}
        <Text style={styles.sectionTitle}>Explosion</Text>
        <SettingRow label="Radius">
          <NumericInput
            value={settings.explosion.radius}
            onChange={v =>
              update({ explosion: { radius: v } })
            }
            min={20}
            max={300}
          />
        </SettingRow>
        <SettingRow label="Particle size">
          <NumericInput
            value={settings.explosion.baseParticleSize}
            onChange={v =>
              update({ explosion: { baseParticleSize: v } })
            }
            min={4}
            max={48}
          />
        </SettingRow>
        <SettingRow label="Rise height">
          <NumericInput
            value={settings.explosion.riseHeight}
            onChange={v =>
              update({ explosion: { riseHeight: v } })
            }
            min={0}
            max={300}
          />
        </SettingRow>
        <SettingRow label="Fall distance">
          <NumericInput
            value={settings.explosion.fallDistance}
            onChange={v =>
              update({ explosion: { fallDistance: v } })
            }
            min={0}
            max={800}
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
            min={0}
            max={1}
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
            min={0}
            max={1}
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
            min={2}
            max={24}
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
            min={2}
            max={16}
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
            min={2}
            max={16}
          />
        </SettingRow>

        {/* Game layout */}
        <Text style={styles.sectionTitle}>Game Layout</Text>
        <Text style={styles.hint}>
          Changes apply on next game start
        </Text>
        <SettingRow label="Rows">
          <NumericInput
            value={settings.gameLayout.rowsCount}
            onChange={v =>
              update({ gameLayout: { rowsCount: v } })
            }
            min={6}
            max={16}
          />
        </SettingRow>
        <SettingRow label="Columns">
          <NumericInput
            value={settings.gameLayout.columnsCount}
            onChange={v =>
              update({ gameLayout: { columnsCount: v } })
            }
            min={4}
            max={12}
          />
        </SettingRow>
        <SettingRow label="Padding">
          <NumericInput
            value={settings.gameLayout.padding}
            onChange={v =>
              update({ gameLayout: { padding: v } })
            }
            min={0}
            max={60}
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
            min={4}
            max={32}
          />
        </SettingRow>
        <SettingRow label="Keys size">
          <NumericInput
            value={settings.gameLayout.keysSize}
            onChange={v =>
              update({ gameLayout: { keysSize: v } })
            }
            min={24}
            max={80}
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
  }
})
