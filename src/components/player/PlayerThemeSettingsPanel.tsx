import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayerTheme } from '../../context/PlayerThemeContext';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import {
  PLAYER_THEME_SWATCHES,
  sanitizePlayerThemePrefs,
} from '../../utils/resolvePlayerThemeColors';
import { normalizeCoachHexColor } from '../../utils/coachColorPicker';
import {
  parsePlayerThemeAiIntent,
  THEME_AI_EXAMPLE_CHIPS,
  THEME_AI_FALLBACK_MESSAGE,
} from '../../utils/playerThemeAiIntent';
import type { PlayerThemeMode, PlayerThemePrefs } from '../../models/PlayerThemePrefs';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { spacing } from '../../theme/designTokens';

type ModeOption = {
  id: PlayerThemeMode;
  title: string;
  subtitle: string;
  disabled?: boolean;
};

function ModeCard({
  option,
  selected,
  accent,
  previewColors,
  onPress,
}: {
  option: ModeOption;
  selected: boolean;
  accent: string;
  previewColors?: [string, string];
  onPress: () => void;
}) {
  return (
    <PressableSpring
      onPress={onPress}
      disabled={option.disabled}
      scaleTo={0.98}
      haptic
      style={[
        styles.modeCard,
        selected && { borderColor: accent, backgroundColor: `${accent}18` },
        option.disabled && styles.modeCardDisabled,
      ]}
    >
      <View style={styles.modeHead}>
        <View style={[styles.radio, selected && { borderColor: accent }]}>
          {selected ? <View style={[styles.radioDot, { backgroundColor: accent }]} /> : null}
        </View>
        <View style={styles.modeCopy}>
          <ProDayText variant="section" style={styles.modeTitle}>
            {option.title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.modeSub}>
            {option.subtitle}
          </ProDayText>
        </View>
      </View>
      {previewColors ? (
        <View style={styles.swatches}>
          {previewColors.map((color) => (
            <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
          ))}
        </View>
      ) : null}
    </PressableSpring>
  );
}

function ShieldPreview({ accent, accentAlt }: { accent: string; accentAlt: string }) {
  return (
    <LinearGradient
      colors={[PLAYER_DARK.surfaceRaised, PLAYER_DARK.bg]}
      style={styles.previewCard}
    >
      <View style={[styles.previewBar, { backgroundColor: accent }]} />
      <View style={styles.previewBody}>
        <View style={[styles.previewRing, { borderColor: accentAlt }]}>
          <ProDayText variant="caption" style={styles.previewOvr}>
            87
          </ProDayText>
        </View>
        <View style={styles.previewLines}>
          <View style={[styles.previewLine, { backgroundColor: accent, width: '62%' }]} />
          <View style={[styles.previewLineMuted, { width: '44%' }]} />
        </View>
      </View>
    </LinearGradient>
  );
}

export function PlayerThemeSettingsPanel() {
  const theme = usePlayerTheme();
  const [draft, setDraft] = useState<PlayerThemePrefs>(theme.prefs);
  const [hexInput, setHexInput] = useState(theme.prefs.custom?.accent ?? PLAYER_THEME_SWATCHES[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiApplying, setAiApplying] = useState(false);

  const preview = useMemo(
    () =>
      sanitizePlayerThemePrefs({
        ...draft,
        custom: draft.mode === 'custom' ? draft.custom : undefined,
      }),
    [draft],
  );

  const previewColors = useMemo(() => {
    if (preview.mode === 'club' && theme.clubColors) {
      return [theme.clubColors.primary, theme.clubColors.secondary] as [string, string];
    }
    if (preview.mode === 'custom' && preview.custom?.accent) {
      const alt =
        preview.custom.accentSecondary ??
        theme.colors.accentAlt;
      return [preview.custom.accent, alt] as [string, string];
    }
    return [PLAYER_DARK.accent, PLAYER_DARK.accentAlt] as [string, string];
  }, [preview, theme.clubColors, theme.colors.accentAlt]);

  const modeOptions = useMemo<ModeOption[]>(
    () => [
      {
        id: 'default',
        title: 'ProDay',
        subtitle: 'Mint néon — style officiel',
      },
      {
        id: 'club',
        title: 'Couleurs de mon club',
        subtitle: theme.hasClub
          ? theme.clubName
            ? `${theme.clubName} · ${theme.clubColors?.source === 'stored' ? 'couleurs club' : 'teintes dérivées'}`
            : 'Teintes dérivées de ton club'
          : 'Couleurs club indisponibles — rejoins un club',
        disabled: !theme.hasClub,
      },
      {
        id: 'custom',
        title: 'Personnalisé',
        subtitle: 'Choisis tes propres accents',
      },
    ],
    [theme.clubColors?.source, theme.clubName, theme.hasClub],
  );

  const selectMode = useCallback((mode: PlayerThemeMode) => {
    setSaved(false);
    setDraft((prev) => {
      if (mode === 'custom') {
        const accent = prev.custom?.accent ?? PLAYER_THEME_SWATCHES[0];
        return {
          mode,
          custom: {
            accent,
            accentSecondary: prev.custom?.accentSecondary ?? PLAYER_DARK.accentAlt,
          },
        };
      }
      return { mode };
    });
  }, []);

  const selectSwatch = useCallback((color: string) => {
    setSaved(false);
    setHexInput(color);
    setDraft((prev) => ({
      mode: 'custom',
      custom: {
        accent: color,
        accentSecondary: prev.custom?.accentSecondary,
      },
    }));
  }, []);

  const applyHex = useCallback(() => {
    const hex = normalizeCoachHexColor(hexInput);
    if (!hex) return;
    selectSwatch(hex);
  }, [hexInput, selectSwatch]);

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const next = sanitizePlayerThemePrefs({
        ...draft,
        custom: draft.mode === 'custom' ? draft.custom : undefined,
      });
      await theme.setPrefs(next);
      setDraft(next);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [draft, theme]);

  const reset = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await theme.resetPrefs();
      setDraft({ mode: 'default' });
      setHexInput(PLAYER_THEME_SWATCHES[0]);
      setAiReply(null);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [theme]);

  const applyAiTheme = useCallback(
    async (phrase: string) => {
      const trimmed = phrase.trim();
      if (!trimmed) return;
      setAiApplying(true);
      setSaved(false);
      setAiReply(null);
      try {
        const result = parsePlayerThemeAiIntent(trimmed);
        if (!result.ok) {
          setAiReply(result.message);
          return;
        }
        const next = sanitizePlayerThemePrefs(result.prefs);
        setDraft(next);
        if (next.custom?.accent) setHexInput(next.custom.accent);
        setAiReply(result.label);
        await theme.setPrefs(next);
        setSaved(true);
      } finally {
        setAiApplying(false);
      }
    },
    [theme],
  );

  return (
    <View style={styles.root}>
      <ProDayText variant="caption" style={styles.lead}>
        Personnalise l’accent de ton pôle joueur : onglets, cartes, boutons et barres latérales.
      </ProDayText>

      <ShieldPreview accent={previewColors[0]} accentAlt={previewColors[1]} />

      <View style={styles.aiBlock}>
        <ProDayText variant="caption" style={styles.customLabel}>
          Coach couleurs IA
        </ProDayText>
        <ProDayText variant="caption" style={styles.aiLead}>
          Décris les couleurs que tu veux — clubs, mélanges ou teinte unique.
        </ProDayText>
        <TextInput
          value={aiPrompt}
          onChangeText={setAiPrompt}
          placeholder="Décris les couleurs que tu veux…"
          placeholderTextColor={PLAYER_DARK.textDim}
          style={styles.aiInput}
          multiline
          maxLength={200}
        />
        <View style={styles.chipRow}>
          {THEME_AI_EXAMPLE_CHIPS.map((chip) => (
            <PressableSpring
              key={chip}
              onPress={() => {
                setAiPrompt(chip);
                void applyAiTheme(chip);
              }}
              scaleTo={0.97}
              style={styles.aiChip}
            >
              <ProDayText variant="caption" style={styles.aiChipText}>
                {chip}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>
        <PressableSpring
          onPress={() => void applyAiTheme(aiPrompt)}
          disabled={aiApplying || !aiPrompt.trim()}
          scaleTo={0.98}
          haptic
          style={[
            styles.aiApplyBtn,
            { backgroundColor: previewColors[0], opacity: aiApplying || !aiPrompt.trim() ? 0.5 : 1 },
          ]}
        >
          <ProDayText variant="caption" style={styles.primaryBtnText}>
            {aiApplying ? 'Application…' : 'Appliquer'}
          </ProDayText>
        </PressableSpring>
        {aiReply ? (
          <ProDayText variant="caption" style={styles.aiReply}>
            {aiReply}
          </ProDayText>
        ) : null}
        {!aiReply ? (
          <ProDayText variant="caption" style={styles.aiHint}>
            {THEME_AI_FALLBACK_MESSAGE}
          </ProDayText>
        ) : null}
      </View>

      <View style={styles.modeList}>
        {modeOptions.map((option) => (
          <ModeCard
            key={option.id}
            option={option}
            selected={draft.mode === option.id}
            accent={previewColors[0]}
            previewColors={
              option.id === 'default'
                ? [PLAYER_DARK.accent, PLAYER_DARK.accentAlt]
                : option.id === 'club' && theme.clubColors
                  ? [theme.clubColors.primary, theme.clubColors.secondary]
                  : option.id === 'custom' && draft.custom?.accent
                    ? [draft.custom.accent, draft.custom.accentSecondary ?? PLAYER_DARK.accentAlt]
                    : undefined
            }
            onPress={() => selectMode(option.id)}
          />
        ))}
      </View>

      {draft.mode === 'custom' ? (
        <View style={styles.customBlock}>
          <ProDayText variant="caption" style={styles.customLabel}>
            Couleur principale
          </ProDayText>
          <View style={styles.grid}>
            {PLAYER_THEME_SWATCHES.map((color) => {
              const on = draft.custom?.accent === color;
              return (
                <PressableSpring
                  key={color}
                  onPress={() => selectSwatch(color)}
                  scaleTo={0.95}
                  style={[
                    styles.colorChip,
                    { backgroundColor: color },
                    on && styles.colorChipOn,
                  ]}
                >
                  {on ? <Icon name="checkmark-circle" size={14} color="#070B14" variant="filled" /> : null}
                </PressableSpring>
              );
            })}
          </View>
          {Platform.OS === 'web' ? (
            <View style={styles.hexRow}>
              <TextInput
                value={hexInput}
                onChangeText={setHexInput}
                placeholder="#00E676"
                placeholderTextColor={PLAYER_DARK.textDim}
                autoCapitalize="characters"
                style={styles.hexInput}
              />
              <PressableSpring onPress={applyHex} scaleTo={0.97} style={styles.hexBtn}>
                <ProDayText variant="caption" style={styles.hexBtnText}>
                  Appliquer
                </ProDayText>
              </PressableSpring>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <PressableSpring
          onPress={() => void save()}
          disabled={saving}
          scaleTo={0.98}
          haptic
          style={[styles.primaryBtn, { backgroundColor: previewColors[0] }]}
        >
          <ProDayText variant="caption" style={styles.primaryBtnText}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          onPress={() => void reset()}
          disabled={saving}
          scaleTo={0.98}
          style={styles.secondaryBtn}
        >
          <ProDayText variant="caption" style={styles.secondaryBtnText}>
            Réinitialiser ProDay
          </ProDayText>
        </PressableSpring>
      </View>

      {saved ? (
        <ProDayText variant="caption" style={styles.savedHint}>
          Préférences enregistrées — l’interface se met à jour immédiatement.
        </ProDayText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  lead: {
    color: PLAYER_DARK.textMuted,
    lineHeight: 18,
  },
  previewCard: {
    borderRadius: PLAYER_DARK_RADIUS.card,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    overflow: 'hidden',
    minHeight: 96,
    flexDirection: 'row',
  },
  previewBar: {
    width: 4,
  },
  previewBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  previewRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.85)',
  },
  previewOvr: {
    color: PLAYER_DARK.text,
    fontWeight: '900',
    fontSize: 16,
  },
  previewLines: {
    flex: 1,
    gap: 8,
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
  },
  previewLineMuted: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  modeList: { gap: spacing.sm },
  modeCard: {
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: PLAYER_DARK.surface,
  },
  modeCardDisabled: { opacity: 0.45 },
  modeHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: PLAYER_DARK.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeCopy: { flex: 1, gap: 2 },
  modeTitle: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
  },
  modeSub: {
    color: PLAYER_DARK.textMuted,
    lineHeight: 16,
  },
  swatches: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 26,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  customBlock: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: PLAYER_DARK.bgElevated,
  },
  customLabel: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  colorChipOn: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  hexRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    color: PLAYER_DARK.text,
    fontWeight: '700',
    backgroundColor: PLAYER_DARK.surface,
  },
  hexBtn: {
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: PLAYER_DARK.surface,
  },
  hexBtnText: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
  },
  actions: { gap: spacing.sm },
  primaryBtn: {
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#070B14',
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: PLAYER_DARK.surface,
  },
  secondaryBtnText: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '800',
  },
  savedHint: {
    color: PLAYER_DARK.accentAlt,
    textAlign: 'center',
  },
  aiBlock: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: PLAYER_DARK.bgElevated,
  },
  aiLead: {
    color: PLAYER_DARK.textMuted,
    lineHeight: 16,
  },
  aiInput: {
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    color: PLAYER_DARK.text,
    minHeight: 44,
    maxHeight: 80,
    backgroundColor: PLAYER_DARK.surface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: PLAYER_DARK.surface,
  },
  aiChipText: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
    fontSize: 11,
  },
  aiApplyBtn: {
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aiReply: {
    color: PLAYER_DARK.accentAlt,
    lineHeight: 18,
  },
  aiHint: {
    color: PLAYER_DARK.textDim,
    lineHeight: 16,
    fontSize: 11,
  },
});
