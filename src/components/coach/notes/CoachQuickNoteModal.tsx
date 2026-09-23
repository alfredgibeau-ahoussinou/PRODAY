import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { coachChrome } from '../../../features/coach/theme/coachDesignSystem';
import { CoachText } from '../CoachText';
import { PressableSpring } from '../../motion';
import { radius, spacing } from '../../../theme/designTokens';
import { withAlpha } from '../../../utils/coachTeamTheme';
import {
  coachQuickNotesService,
  type CoachQuickNote,
  COACH_QUICK_NOTE_DEFAULT_TAGS,
  COACH_QUICK_NOTE_SUGGESTIONS,
} from '../../../services/coachQuickNotes.service';

export interface CoachQuickNoteModalProps {
  visible: boolean;
  onClose: () => void;
  coachUid: string;
  clubId: string;
  teamId?: string;
  eventId?: string;
  sessionTitle?: string;
  players?: Array<{ uid: string; name: string }>;
  initialPlayerUid?: string;
  initialPlayerName?: string;
  initialTag?: string;
  onNoteSaved?: (note: CoachQuickNote) => void;
}

export const CoachQuickNoteModal: React.FC<CoachQuickNoteModalProps> = ({
  visible,
  onClose,
  coachUid,
  clubId,
  teamId,
  eventId,
  sessionTitle,
  players = [],
  initialPlayerUid,
  initialPlayerName,
  initialTag,
  onNoteSaved,
}) => {
  const { tokens } = useCoachTheme();
  const { width } = useWindowDimensions();
  const sheetMode = coachChrome.modalIsSheet(width);

  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | undefined>(initialPlayerUid);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | undefined>(initialPlayerName);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTag ? [initialTag] : ['#tactique']
  );
  const [content, setContent] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [saving, setSaving] = useState(false);

  // Synchronisation lors de l'ouverture
  useEffect(() => {
    if (visible) {
      setSelectedPlayerUid(initialPlayerUid);
      setSelectedPlayerName(initialPlayerName);
      setSelectedTags(initialTag ? [initialTag] : ['#tactique']);
      setContent('');
      setPlayerFilter('');
      setSaving(false);
    }
  }, [visible, initialPlayerUid, initialPlayerName, initialTag]);

  const filteredPlayers = useMemo(() => {
    if (!playerFilter.trim()) return players;
    const q = playerFilter.toLowerCase().trim();
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, playerFilter]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSelectPlayer = useCallback((uid?: string, name?: string) => {
    setSelectedPlayerUid(uid);
    setSelectedPlayerName(name);
  }, []);

  const handleAppendSuggestion = useCallback((suggestion: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return suggestion;
      return `${trimmed}. ${suggestion}`;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      const saved = await coachQuickNotesService.saveNote({
        coachUid,
        clubId,
        teamId,
        eventId,
        sessionTitle,
        playerUid: selectedPlayerUid,
        playerName: selectedPlayerName,
        content: content.trim(),
        tags: selectedTags,
      });

      onNoteSaved?.(saved);
      onClose();
    } catch (err) {
      console.warn('[CoachQuickNoteModal] Impossible d’enregistrer la note:', err);
    } finally {
      setSaving(false);
    }
  }, [
    content,
    saving,
    coachUid,
    clubId,
    teamId,
    eventId,
    sessionTitle,
    selectedPlayerUid,
    selectedPlayerName,
    selectedTags,
    onNoteSaved,
    onClose,
  ]);

  const styles = useMemo(() => createStyles(tokens, sheetMode), [tokens, sheetMode]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.sheet} testID="coach-quick-note-modal">
          {/* Entête */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerBadge}>
                <Ionicons name="flash" size={14} color={tokens.accent} />
                <CoachText variant="caption" style={styles.headerBadgeText}>
                  Terrain
                </CoachText>
              </View>
              <CoachText variant="section" style={styles.headerTitle}>
                Note Rapide du Staff
              </CoachText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={22} color={tokens.muted} />
            </Pressable>
          </View>

          {sessionTitle ? (
            <View style={styles.sessionBanner}>
              <Ionicons name="calendar-outline" size={13} color={tokens.muted} />
              <CoachText variant="caption" muted numberOfLines={1} style={styles.sessionText}>
                {sessionTitle}
              </CoachText>
            </View>
          ) : null}

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Sélection du joueur */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <CoachText variant="caption" style={styles.sectionLabel}>
                  CIBLE DE LA NOTE
                </CoachText>
                {selectedPlayerName ? (
                  <Pressable onPress={() => handleSelectPlayer(undefined, undefined)}>
                    <CoachText variant="caption" style={styles.clearPlayerText}>
                      Effacer
                    </CoachText>
                  </Pressable>
                ) : null}
              </View>

              {players.length > 5 ? (
                <View style={styles.filterInputRow}>
                  <Ionicons name="search" size={14} color={tokens.muted} />
                  <TextInput
                    value={playerFilter}
                    onChangeText={setPlayerFilter}
                    placeholder="Filtrer un joueur..."
                    placeholderTextColor={tokens.muted}
                    style={styles.filterInput}
                  />
                  {playerFilter ? (
                    <Pressable onPress={() => setPlayerFilter('')}
                      accessibilityRole="button"
                      accessibilityLabel="Fermer">
                      <Ionicons name="close-circle" size={14} color={tokens.muted} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                <PressableSpring
                  onPress={() => handleSelectPlayer(undefined, undefined)}
                  style={[
                    styles.playerChip,
                    !selectedPlayerUid && styles.playerChipActive,
                  ]}
                  testID="player-chip-general"
                >
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={!selectedPlayerUid ? tokens.accent : tokens.muted}
                  />
                  <CoachText
                    variant="caption"
                    style={[
                      styles.playerChipText,
                      !selectedPlayerUid && styles.playerChipTextActive,
                    ]}
                  >
                    Toute l'équipe
                  </CoachText>
                </PressableSpring>

                {filteredPlayers.map((p) => {
                  const isActive = selectedPlayerUid === p.uid;
                  return (
                    <PressableSpring
                      key={p.uid}
                      onPress={() => handleSelectPlayer(p.uid, p.name)}
                      style={[styles.playerChip, isActive && styles.playerChipActive]}
                      testID={`player-chip-${p.uid}`}
                    >
                      <Ionicons
                        name="person"
                        size={12}
                        color={isActive ? tokens.accent : tokens.muted}
                      />
                      <CoachText
                        variant="caption"
                        style={[styles.playerChipText, isActive && styles.playerChipTextActive]}
                      >
                        {p.name}
                      </CoachText>
                    </PressableSpring>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tags rapides */}
            <View style={styles.sectionBlock}>
              <CoachText variant="caption" style={styles.sectionLabel}>
                TAGS RAPIDES
              </CoachText>
              <View style={styles.tagsRow}>
                {COACH_QUICK_NOTE_DEFAULT_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <PressableSpring
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.tagChip, isSelected && styles.tagChipActive]}
                      testID={`tag-chip-${tag}`}
                    >
                      <CoachText
                        variant="caption"
                        style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}
                      >
                        {tag}
                      </CoachText>
                    </PressableSpring>
                  );
                })}
              </View>
            </View>

            {/* Suggestions en un clic */}
            <View style={styles.sectionBlock}>
              <CoachText variant="caption" style={styles.sectionLabel}>
                SUGGESTIONS DU STAFF
              </CoachText>
              <View style={styles.suggestionsRow}>
                {COACH_QUICK_NOTE_SUGGESTIONS.map((suggestion, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleAppendSuggestion(suggestion)}
                    style={styles.suggestionPill}
                  >
                    <Ionicons name="add-circle-outline" size={13} color={tokens.accent} />
                    <CoachText variant="caption" style={styles.suggestionText}>
                      {suggestion}
                    </CoachText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Champ de saisie texte */}
            <View style={styles.sectionBlock}>
              <CoachText variant="caption" style={styles.sectionLabel}>
                OBSERVATION DE TERRAIN
              </CoachText>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Ex: Belle intensité dans le repli, mais retard à la transition..."
                placeholderTextColor={tokens.muted}
                multiline
                numberOfLines={4}
                style={styles.contentInput}
                testID="quick-note-content-input"
              />
            </View>
          </ScrollView>

          {/* Bouton d'enregistrement immédiat */}
          <View style={styles.footer}>
            <PressableSpring
              onPress={handleSave}
              disabled={!content.trim() || saving}
              style={[
                styles.saveButton,
                (!content.trim() || saving) && styles.saveButtonDisabled,
              ]}
              testID="quick-note-save-btn"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <CoachText variant="body" style={styles.saveButtonText}>
                    Enregistrer la note
                  </CoachText>
                </>
              )}
            </PressableSpring>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

function createStyles(tokens: any, sheetMode: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: tokens.card ?? '#181A20',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: sheetMode ? 0 : 20,
      borderBottomRightRadius: sheetMode ? 0 : 20,
      borderWidth: 1,
      borderColor: tokens.border ?? '#2A2E39',
      width: '100%',
      maxWidth: sheetMode ? undefined : 540,
      maxHeight: sheetMode ? '90%' : '85%',
      paddingTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.xs,
    },
    headerLeft: {
      flex: 1,
      gap: 2,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerBadgeText: {
      color: tokens.accent,
      fontWeight: '800',
      textTransform: 'uppercase',
      fontSize: 10,
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontWeight: '800',
      color: tokens.foreground,
      fontSize: 18,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    sessionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: withAlpha(tokens.muted, 0.1),
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.xs,
    },
    sessionText: {
      flex: 1,
      fontSize: 12,
    },
    bodyScroll: {
      flexShrink: 1,
    },
    bodyContent: {
      paddingVertical: spacing.xs,
      gap: spacing.md,
    },
    sectionBlock: {
      gap: 6,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
      letterSpacing: 0.6,
    },
    clearPlayerText: {
      fontSize: 11,
      color: tokens.accent,
      fontWeight: '600',
    },
    filterInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: tokens.background ?? '#0F1015',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: spacing.sm,
      height: 32,
    },
    filterInput: {
      flex: 1,
      color: tokens.foreground,
      fontSize: 12,
      padding: 0,
    },
    chipsScroll: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    playerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated ?? '#1F222B',
    },
    playerChipActive: {
      borderColor: tokens.accent,
      backgroundColor: withAlpha(tokens.accent, 0.15),
    },
    playerChipText: {
      fontSize: 12,
      color: tokens.foreground,
      fontWeight: '600',
    },
    playerChipTextActive: {
      color: tokens.accent,
      fontWeight: '800',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    tagChip: {
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated ?? '#1F222B',
    },
    tagChipActive: {
      borderColor: tokens.accent,
      backgroundColor: withAlpha(tokens.accent, 0.2),
    },
    tagChipText: {
      fontSize: 12,
      color: tokens.muted,
      fontWeight: '600',
    },
    tagChipTextActive: {
      color: tokens.accent,
      fontWeight: '800',
    },
    suggestionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    suggestionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
      backgroundColor: withAlpha(tokens.muted, 0.08),
      borderWidth: 1,
      borderColor: withAlpha(tokens.muted, 0.15),
    },
    suggestionText: {
      fontSize: 11,
      color: tokens.foreground,
    },
    contentInput: {
      minHeight: 85,
      maxHeight: 140,
      backgroundColor: tokens.background ?? '#0F1015',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      color: tokens.foreground,
      padding: spacing.sm,
      fontSize: 13,
      textAlignVertical: 'top',
    },
    footer: {
      paddingTop: spacing.sm,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: tokens.accent,
      borderRadius: radius.pill,
      height: 46,
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
    },
  });
}
