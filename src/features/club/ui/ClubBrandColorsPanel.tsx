import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { PLAYER_THEME_SWATCHES } from '../../../utils/resolvePlayerThemeColors';
import { normalizeCoachHexColor } from '../../../utils/coachColorPicker';
import {
  CLUB_THEME_AI_EXAMPLE_CHIPS,
  CLUB_THEME_AI_FALLBACK_MESSAGE,
  CLUB_THEME_AI_REMOTE_PROMPT,
  parseClubColorsFromAssistantReply,
  parseClubThemeAiIntent,
  suggestClubColorsFromName,
} from '../../../utils/clubThemeAiIntent';
import { sendClubAssistantMessage } from '../../../services/clubAssistant.service';
import { stripDashTypography } from '../../../utils/stripDashTypography';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubBrandColors } from '../hooks/useClubBrandColors';
import { openClubHelpChatbot } from '../shell/clubHelpOpen';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { ClubText } from './clubUi';

type Props = {
  onSaved?: () => void | Promise<void>;
};

export const CLUB_PRESET_DUOS = [
  { id: 'marine_or', label: 'Marine & Or', primary: '#0F172A', secondary: '#F59E0B' },
  { id: 'azur_blanc', label: 'Azur & Blanc', primary: '#0284C7', secondary: '#FFFFFF' },
  { id: 'rouge_noir', label: 'Rouge & Noir', primary: '#DC2626', secondary: '#18181B' },
  { id: 'emeraude_or', label: 'Émeraude & Or', primary: '#059669', secondary: '#FBBF24' },
  { id: 'vert_blanc', label: 'Vert & Blanc', primary: '#16A34A', secondary: '#FFFFFF' },
  { id: 'bordeaux_ciel', label: 'Bordeaux & Ciel', primary: '#991B1B', secondary: '#38BDF8' },
  { id: 'violet_or', label: 'Violet & Or', primary: '#7C3AED', secondary: '#F59E0B' },
  { id: 'carbone_blanc', label: 'Obsidian & Blanc', primary: '#18181B', secondary: '#F8FAFC' },
];

/**
 * Sélecteur de charte graphique et couleurs du club — Obsidian Glass Studio.
 * Harmonisation 1-tap, aperçu en direct & copilote IA repliable.
 */
export function ClubBrandColorsPanel({ onSaved }: Props) {
  const { tokens, brand, club } = useClubTheme();
  const brandColors = useClubBrandColors(onSaved);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const [primary, setPrimary] = useState(brand?.primary ?? tokens.accent);
  const [secondary, setSecondary] = useState(brand?.secondary ?? tokens.secondary);
  const [hexPrimary, setHexPrimary] = useState(brand?.primary ?? tokens.accent);
  const [hexSecondary, setHexSecondary] = useState(brand?.secondary ?? tokens.secondary);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedHint, setSavedHint] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setPrimary(brand.primary);
    setSecondary(brand.secondary);
    setHexPrimary(brand.primary);
    setHexSecondary(brand.secondary);
  }, [brand?.primary, brand?.secondary]);

  useEffect(() => {
    if (brand?.source === 'stored') return;
    const suggestion = suggestClubColorsFromName(club?.name);
    if (suggestion?.ok) {
      setAiReply(`Suggestion pour ${club?.name ?? 'le club'} : ${suggestion.label}`);
    }
  }, [club?.name, brand?.source]);

  const selectPrimary = useCallback((color: string) => {
    setSavedHint(false);
    setPrimary(color);
    setHexPrimary(color);
  }, []);

  const selectSecondary = useCallback((color: string) => {
    setSavedHint(false);
    setSecondary(color);
    setHexSecondary(color);
  }, []);

  const selectDuo = useCallback((duoPrimary: string, duoSecondary: string) => {
    setSavedHint(false);
    setPrimary(duoPrimary);
    setSecondary(duoSecondary);
    setHexPrimary(duoPrimary);
    setHexSecondary(duoSecondary);
  }, []);

  const applyHexPair = useCallback(() => {
    const p = normalizeCoachHexColor(hexPrimary);
    const s = normalizeCoachHexColor(hexSecondary);
    if (p) selectPrimary(p);
    if (s) selectSecondary(s);
  }, [hexPrimary, hexSecondary, selectPrimary, selectSecondary]);

  const persist = useCallback(
    async (nextPrimary: string, nextSecondary: string) => {
      const ok = await brandColors.saveColors(nextPrimary, nextSecondary);
      if (ok) {
        setSavedHint(true);
        setAiReply(null);
      }
      return ok;
    },
    [brandColors],
  );

  const confirmAiColors = useCallback(
    (nextPrimary: string, nextSecondary: string, label: string) => {
      Alert.alert(
        'Appliquer cette charte ?',
        `${label}\n\nPrincipale : ${nextPrimary} · Secondaire : ${nextSecondary}\n\nCette charte sera reprise sur tous les maillots et les interfaces des licenciés.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Appliquer & Enregistrer',
            style: 'default',
            onPress: () => {
              selectPrimary(nextPrimary);
              selectSecondary(nextSecondary);
              void persist(nextPrimary, nextSecondary).then((ok) => {
                if (ok) setAiReply(label);
              });
            },
          },
        ],
      );
    },
    [persist, selectPrimary, selectSecondary],
  );

  const runRemoteAi = useCallback(
    async (phrase: string) => {
      setAiLoading(true);
      setAiReply('Analyse copilote en cours…');
      try {
        const res = await sendClubAssistantMessage([
          { role: 'user', content: CLUB_THEME_AI_REMOTE_PROMPT(phrase) },
        ]);
        const reply = stripDashTypography(res.reply);
        const parsed = parseClubColorsFromAssistantReply(reply);
        if (!parsed?.ok) {
          setAiReply(
            reply.slice(0, 220) ||
              'Le copilote n’a pas renvoyé de palette exploitable. Reformule ou ouvre le Copilote.',
          );
          return;
        }
        setAiReply(parsed.label);
        confirmAiColors(parsed.colors.primary, parsed.colors.secondary, parsed.label);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Analyse indisponible.';
        setAiReply(`Copilote indisponible (${msg}). Ouvre le Copilote ou choisis un raccourci.`);
      } finally {
        setAiLoading(false);
      }
    },
    [confirmAiColors],
  );

  const runAi = useCallback(
    (phrase: string) => {
      const trimmed = phrase.trim();
      if (!trimmed || aiLoading) return;
      if (!brandColors.canEdit) {
        Alert.alert(
          'Couleurs du club',
          'Seuls les gestionnaires rattachés à ce club peuvent modifier la charte.',
        );
        return;
      }
      setAiReply(null);
      const local = parseClubThemeAiIntent(trimmed);
      if (local.ok) {
        confirmAiColors(local.colors.primary, local.colors.secondary, local.label);
        return;
      }
      void runRemoteAi(trimmed);
    },
    [aiLoading, brandColors.canEdit, confirmAiColors, runRemoteAi],
  );

  const saveManual = useCallback(() => {
    if (!brandColors.canEdit) {
      Alert.alert(
        'Couleurs du club',
        'Seuls les gestionnaires rattachés à ce club peuvent modifier la charte.',
      );
      return;
    }
    void persist(primary, secondary);
  }, [brandColors.canEdit, persist, primary, secondary]);

  return (
    <View style={styles.root}>
      {/* Visual Live Studio Preview Card */}
      <View style={styles.previewCard}>
        <LinearGradient
          colors={['rgba(28, 34, 52, 0.95)', 'rgba(16, 18, 26, 0.98)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.previewHeader}>
          <ClubText variant="caption" style={styles.previewSectionTag}>
            CHARTE OFFICIELLE
          </ClubText>
          <View style={styles.sourceChip}>
            <ClubText variant="caption" muted style={styles.sourceText}>
              {brand?.source === 'stored' ? 'Enregistrée' : 'ProDay Studio'}
            </ClubText>
          </View>
        </View>

        <View style={styles.swatchHeroRow}>
          {/* Dual tone badge */}
          <View style={styles.dualSwatchWrap}>
            <View style={[styles.dualHalf, { backgroundColor: primary }]} />
            <View style={[styles.dualHalf, { backgroundColor: secondary }]} />
          </View>

          <View style={styles.heroTextCol}>
            <View style={styles.colorPillRow}>
              <View style={[styles.colorMiniDot, { backgroundColor: primary }]} />
              <ClubText variant="caption" style={styles.colorValueText}>
                Principale : {primary.toUpperCase()}
              </ClubText>
            </View>
            <View style={styles.colorPillRow}>
              <View style={[styles.colorMiniDot, { backgroundColor: secondary }]} />
              <ClubText variant="caption" muted style={styles.colorValueText}>
                Secondaire : {secondary.toUpperCase()}
              </ClubText>
            </View>
          </View>
        </View>
      </View>

      {/* Preset Duos (1-Tap Selection) */}
      <View style={styles.duosContainer}>
        <ClubText variant="label" muted style={styles.blockLabel}>
          Harmonies Recommandées
        </ClubText>
        <View style={styles.duosGrid}>
          {CLUB_PRESET_DUOS.map((duo) => {
            const isSelected = primary === duo.primary && secondary === duo.secondary;
            return (
              <PressableSpring
                key={duo.id}
                onPress={() => selectDuo(duo.primary, duo.secondary)}
                scaleTo={0.96}
                haptic
                style={[
                  styles.duoCard,
                  isSelected && {
                    borderColor: tokens.accent,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  },
                ]}
              >
                <View style={styles.duoSwatch}>
                  <View style={[styles.duoSwatchHalf, { backgroundColor: duo.primary }]} />
                  <View style={[styles.duoSwatchHalf, { backgroundColor: duo.secondary }]} />
                </View>
                <ClubText
                  variant="caption"
                  numberOfLines={1}
                  style={[
                    styles.duoLabel,
                    isSelected && { color: tokens.foreground, fontWeight: '800' },
                  ]}
                >
                  {duo.label}
                </ClubText>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* Accordion Toggle for Advanced Customization & Copilot */}
      <PressableSpring
        onPress={() => setShowAdvanced((prev) => !prev)}
        scaleTo={0.98}
        haptic
        style={styles.advancedToggleBtn}
      >
        <View style={styles.toggleRow}>
          <Icon name="tune" size={15} color={tokens.accent} />
          <ClubText variant="caption" style={styles.toggleText}>
            {showAdvanced
              ? 'Masquer le studio sur-mesure'
              : 'Palette personnalisée & Copilote IA'}
          </ClubText>
        </View>
        <Icon
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={tokens.muted}
        />
      </PressableSpring>

      {/* Advanced Studio Panel (Copilote + Color Pickers) */}
      {showAdvanced ? (
        <View style={styles.advancedPanel}>
          {/* AI Copilot Block */}
          <View style={styles.aiBlock}>
            <View style={styles.aiHeader}>
              <Icon name="star-four-points" size={14} color={tokens.accent} />
              <ClubText variant="caption" style={{ fontWeight: '800', color: tokens.accent }}>
                Copilote IA de charte
              </ClubText>
            </View>

            <TextInput
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="Ex. Nuit parisienne, vert forêt et or, azur ciel…"
              placeholderTextColor={tokens.muted}
              style={styles.aiInput}
              editable={brandColors.canEdit && !aiLoading}
              maxLength={200}
            />

            <View style={styles.chipRow}>
              {CLUB_THEME_AI_EXAMPLE_CHIPS.map((chip) => (
                <PressableSpring
                  key={chip}
                  onPress={() => {
                    setAiPrompt(chip);
                    runAi(chip);
                  }}
                  disabled={!brandColors.canEdit || aiLoading}
                  scaleTo={0.96}
                  style={styles.chip}
                >
                  <ClubText variant="caption" muted style={styles.chipText}>
                    {chip}
                  </ClubText>
                </PressableSpring>
              ))}
            </View>

            <PressableSpring
              onPress={() => runAi(aiPrompt)}
              disabled={!brandColors.canEdit || brandColors.saving || aiLoading || !aiPrompt.trim()}
              scaleTo={0.98}
              haptic
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: tokens.accent,
                  opacity:
                    !brandColors.canEdit || brandColors.saving || aiLoading || !aiPrompt.trim()
                      ? 0.45
                      : 1,
                },
              ]}
            >
              {aiLoading ? (
                <ActivityIndicator color={tokens.onAccent} />
              ) : (
                <ClubText variant="caption" style={{ color: tokens.onAccent, fontWeight: '800' }}>
                  Analyser avec le copilote
                </ClubText>
              )}
            </PressableSpring>

            {aiReply ? (
              <ClubText variant="caption" style={styles.replyText}>
                {aiReply}
              </ClubText>
            ) : null}
          </View>

          {/* Individual Color Swatches Grid */}
          {brandColors.canEdit ? (
            <View style={styles.swatchesGroup}>
              {/* Primary Color */}
              <View style={styles.swatchBlock}>
                <ClubText variant="caption" style={styles.swatchBlockTitle}>
                  Nuancier Principal
                </ClubText>
                <View style={styles.compactGrid}>
                  {PLAYER_THEME_SWATCHES.map((color) => {
                    const on = primary.toLowerCase() === color.toLowerCase();
                    return (
                      <PressableSpring
                        key={`p-${color}`}
                        onPress={() => selectPrimary(color)}
                        scaleTo={0.92}
                        style={[
                          styles.compactColorChip,
                          { backgroundColor: color },
                          on && styles.colorChipOn,
                        ]}
                      >
                        {on ? (
                          <Icon name="checkmark-circle" size={14} color="#070B14" variant="filled" />
                        ) : null}
                      </PressableSpring>
                    );
                  })}
                </View>
              </View>

              {/* Secondary Color */}
              <View style={styles.swatchBlock}>
                <ClubText variant="caption" style={styles.swatchBlockTitle}>
                  Nuancier Secondaire
                </ClubText>
                <View style={styles.compactGrid}>
                  {PLAYER_THEME_SWATCHES.map((color) => {
                    const on = secondary.toLowerCase() === color.toLowerCase();
                    return (
                      <PressableSpring
                        key={`s-${color}`}
                        onPress={() => selectSecondary(color)}
                        scaleTo={0.92}
                        style={[
                          styles.compactColorChip,
                          { backgroundColor: color },
                          on && styles.colorChipOn,
                        ]}
                      >
                        {on ? (
                          <Icon name="checkmark-circle" size={14} color="#070B14" variant="filled" />
                        ) : null}
                      </PressableSpring>
                    );
                  })}
                </View>
              </View>

              {Platform.OS === 'web' ? (
                <View style={styles.hexRow}>
                  <TextInput
                    value={hexPrimary}
                    onChangeText={setHexPrimary}
                    placeholder="#10B981"
                    placeholderTextColor={tokens.muted}
                    autoCapitalize="characters"
                    style={styles.hexInput}
                  />
                  <TextInput
                    value={hexSecondary}
                    onChangeText={setHexSecondary}
                    placeholder="#FFFFFF"
                    placeholderTextColor={tokens.muted}
                    autoCapitalize="characters"
                    style={styles.hexInput}
                  />
                  <PressableSpring onPress={applyHexPair} scaleTo={0.97} style={styles.hexBtn}>
                    <ClubText variant="caption" style={{ fontWeight: '800' }}>
                      OK
                    </ClubText>
                  </PressableSpring>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Save Button */}
      {brandColors.canEdit ? (
        <PressableSpring
          onPress={saveManual}
          disabled={brandColors.saving}
          scaleTo={0.98}
          haptic
          style={[
            styles.primaryBtn,
            {
              backgroundColor: tokens.accent,
              opacity: brandColors.saving ? 0.6 : 1,
            },
          ]}
        >
          {brandColors.saving ? (
            <ActivityIndicator color={tokens.onAccent} />
          ) : (
            <ClubText variant="caption" style={{ color: tokens.onAccent, fontWeight: '800' }}>
              Enregistrer la charte du club
            </ClubText>
          )}
        </PressableSpring>
      ) : (
        <ClubText variant="caption" muted style={{ textAlign: 'center' }}>
          Mode lecture seule — seul l’administrateur club peut modifier la charte.
        </ClubText>
      )}

      {savedHint ? (
        <View style={styles.savedToast}>
          <Icon name="checkmark-circle" size={15} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Charte enregistrée et synchronisée avec tous les effectifs.
          </ClubText>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { gap: clubSpace.md },
    previewCard: {
      borderRadius: clubRadius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      padding: clubSpace.md,
      gap: clubSpace.sm,
      ...clubShadow.card,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    previewSectionTag: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: tokens.accent,
      textTransform: 'uppercase',
    },
    sourceChip: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: clubRadius.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    sourceText: {
      fontSize: 10,
      fontWeight: '600',
    },
    swatchHeroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      marginTop: 4,
    },
    dualSwatchWrap: {
      width: 58,
      height: 58,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      flexDirection: 'row',
      ...clubShadow.lift,
    },
    dualHalf: {
      flex: 1,
      height: '100%',
    },
    heroTextCol: {
      flex: 1,
      gap: 5,
    },
    colorPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    colorMiniDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    colorValueText: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
    },
    duosContainer: {
      gap: 8,
    },
    blockLabel: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
    },
    duosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    duoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '48%',
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: clubRadius.lg,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    duoSwatch: {
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: 'hidden',
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    duoSwatchHalf: {
      flex: 1,
      height: '100%',
    },
    duoLabel: {
      fontSize: 12,
      color: tokens.muted,
      flex: 1,
    },
    advancedToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: clubRadius.lg,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.07)',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
    },
    advancedPanel: {
      gap: clubSpace.md,
      padding: clubSpace.md,
      borderRadius: clubRadius.xl,
      backgroundColor: 'rgba(16, 20, 30, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    aiBlock: {
      gap: 8,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aiInput: {
      borderRadius: clubRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: tokens.foreground,
      paddingVertical: 9,
      paddingHorizontal: 12,
      fontSize: 13,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: clubRadius.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    chipText: {
      fontSize: 11,
    },
    replyText: {
      color: tokens.accent,
      fontSize: 12,
      fontWeight: '600',
    },
    swatchesGroup: {
      gap: 12,
      marginTop: 4,
    },
    swatchBlock: {
      gap: 6,
    },
    swatchBlockTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
    },
    compactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    compactColorChip: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    colorChipOn: {
      borderColor: '#FFFFFF',
      borderWidth: 2,
      transform: [{ scale: 1.1 }],
    },
    hexRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    hexInput: {
      flex: 1,
      height: 36,
      borderRadius: clubRadius.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: tokens.foreground,
      paddingHorizontal: 10,
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    hexBtn: {
      paddingHorizontal: 14,
      borderRadius: clubRadius.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: clubRadius.pill,
      ...clubShadow.lift,
    },
    savedToast: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: clubRadius.pill,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
  });
