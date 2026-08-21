import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, TextInput, View } from 'react-native';
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
import { spacing } from '../../../theme/designTokens';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubBrandColors } from '../hooks/useClubBrandColors';
import { openClubHelpChatbot } from '../shell/clubHelpOpen';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { ClubText } from './clubUi';

type Props = {
  onSaved?: () => void | Promise<void>;
};

/**
 * Sélecteur couleurs club — swatches + analyse copilote Mistral (confirmation avant apply).
 * Owner seulement pour éditer.
 */
export function ClubBrandColorsPanel({ onSaved }: Props) {
  const { tokens, brand, club } = useClubTheme();
  const brandColors = useClubBrandColors(onSaved);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const [primary, setPrimary] = useState(brand?.primary ?? tokens.accent);
  const [secondary, setSecondary] = useState(brand?.secondary ?? tokens.secondary);
  const [hexPrimary, setHexPrimary] = useState(brand?.primary ?? tokens.accent);
  const [hexSecondary, setHexSecondary] = useState(brand?.secondary ?? tokens.secondary);
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
      setAiReply(`Suggestion d’après le nom du club — ${suggestion.label}`);
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
        'Appliquer ces couleurs ?',
        `${label}\n\nPrincipale ${nextPrimary} · Secondaire ${nextSecondary}\n\nElles seront reprises par les joueurs et coachs licenciés du club.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Appliquer',
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
      setAiReply('Analyse Mistral en cours…');
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
          'Seuls les comptes Club rattachés à ce club peuvent modifier les couleurs.',
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
        'Seuls les comptes Club rattachés à ce club peuvent modifier les couleurs.',
      );
      return;
    }
    void persist(primary, secondary);
  }, [brandColors.canEdit, persist, primary, secondary]);

  return (
    <View style={styles.root}>
      <ClubText variant="caption" muted>
        Choisis les couleurs du club depuis cet espace. Elles s’appliquent au pôle Club et aux
        joueurs / coachs licenciés (mode couleurs club).
      </ClubText>

      <View style={styles.previewRow}>
        <View style={[styles.previewSwatch, { backgroundColor: primary }]} />
        <View style={[styles.previewSwatch, { backgroundColor: secondary }]} />
        <View style={{ flex: 1, gap: 2 }}>
          <ClubText variant="caption">Principale {primary}</ClubText>
          <ClubText variant="caption" muted>
            Secondaire {secondary}
          </ClubText>
        </View>
      </View>

      <View style={styles.aiBlock}>
        <ClubText variant="caption" style={styles.blockLabel}>
          Copilote couleurs
        </ClubText>
        <ClubText variant="caption" muted>
          Décris un style, un club ou un mélange — analyse Mistral réelle. Confirmation avant
          d’écraser les couleurs enregistrées.
        </ClubText>
        <TextInput
          value={aiPrompt}
          onChangeText={setAiPrompt}
          placeholder="Ex. ambiance nuit parisienne, vert forêt et or…"
          placeholderTextColor={tokens.muted}
          style={styles.aiInput}
          editable={brandColors.canEdit && !aiLoading}
          multiline
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
              scaleTo={0.97}
              style={styles.chip}
            >
              <ClubText variant="caption" muted>
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
        <PressableSpring
          onPress={() => {
            if (!openClubHelpChatbot()) {
              Alert.alert('Copilote', 'Ouvre Copilote depuis le menu Club pour discuter librement.');
            }
          }}
          scaleTo={0.98}
          style={styles.secondaryLink}
        >
          <Icon name="star-four-points" size={14} color={tokens.accent} />
          <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Ouvrir le Copilote Club
          </ClubText>
        </PressableSpring>
        {aiReply ? (
          <ClubText variant="caption" style={{ color: tokens.secondary }}>
            {aiReply}
          </ClubText>
        ) : (
          <ClubText variant="caption" muted style={{ fontSize: 11 }}>
            {CLUB_THEME_AI_FALLBACK_MESSAGE}
          </ClubText>
        )}
      </View>

      {brandColors.canEdit ? (
        <>
          <View style={styles.block}>
            <ClubText variant="caption" style={styles.blockLabel}>
              Couleur principale
            </ClubText>
            <View style={styles.grid}>
              {PLAYER_THEME_SWATCHES.map((color) => {
                const on = primary === color;
                return (
                  <PressableSpring
                    key={`p-${color}`}
                    onPress={() => selectPrimary(color)}
                    scaleTo={0.95}
                    style={[
                      styles.colorChip,
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

          <View style={styles.block}>
            <ClubText variant="caption" style={styles.blockLabel}>
              Couleur secondaire
            </ClubText>
            <View style={styles.grid}>
              {PLAYER_THEME_SWATCHES.map((color) => {
                const on = secondary === color;
                return (
                  <PressableSpring
                    key={`s-${color}`}
                    onPress={() => selectSecondary(color)}
                    scaleTo={0.95}
                    style={[
                      styles.colorChip,
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
                placeholder="#006CFC"
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
                <ClubText variant="caption">OK</ClubText>
              </PressableSpring>
            </View>
          ) : null}

          <PressableSpring
            onPress={saveManual}
            disabled={brandColors.saving}
            scaleTo={0.98}
            haptic
            style={[
              styles.primaryBtn,
              {
                backgroundColor: tokens.accent,
                opacity: brandColors.saving ? 0.5 : 1,
              },
            ]}
          >
            <ClubText variant="caption" style={{ color: tokens.onAccent, fontWeight: '800' }}>
              {brandColors.saving ? 'Enregistrement…' : 'Enregistrer les couleurs'}
            </ClubText>
          </PressableSpring>
        </>
      ) : (
        <ClubText variant="caption" muted>
          Lecture seule — seul le propriétaire du club peut modifier la palette.
        </ClubText>
      )}

      {savedHint ? (
        <ClubText variant="caption" style={{ color: tokens.secondary }}>
          Couleurs enregistrées — thème Club mis à jour. Les licenciés les verront dès le prochain
          chargement.
        </ClubText>
      ) : null}
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { gap: spacing.md },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    previewSwatch: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    aiBlock: {
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 14,
      padding: spacing.md,
      backgroundColor: tokens.elevated,
    },
    block: {
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 14,
      padding: spacing.md,
      backgroundColor: tokens.elevated,
    },
    blockLabel: {
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontSize: 10,
      color: tokens.muted,
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
    aiInput: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      color: tokens.foreground,
      minHeight: 44,
      maxHeight: 80,
      backgroundColor: tokens.surface,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
    },
    primaryBtn: {
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    secondaryLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
    },
    hexRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    hexInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      color: tokens.foreground,
      fontWeight: '700',
      backgroundColor: tokens.surface,
    },
    hexBtn: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      backgroundColor: tokens.surface,
    },
  });
