import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
  Platform,
} from 'react-native';
import { CoachText } from './coachPortalUi';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../theme/designTokens';
import { federationService } from '../../services/federation.service';
import type { FederationTeam } from '../../models/Federation';

interface FederationSyncDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSyncStarted: (teamName?: string) => void;
  localTeamId: string;
}

export function FederationSyncDrawer({
  visible,
  onClose,
  onSyncStarted,
  localTeamId,
}: FederationSyncDrawerProps) {
  const { tokens } = useCoachTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FederationTeam[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<FederationTeam | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      setSearching(true);
      const res = await federationService.searchTeams(text);
      setResults(res);
      setSearching(false);
    } else {
      setResults([]);
    }
  };

  const handleImport = async () => {
    if (!selectedTeam) return;
    onClose();
    onSyncStarted(selectedTeam.name);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.overlayBg}>
          <PressableSpring style={StyleSheet.absoluteFill} onPress={onClose}><View /></PressableSpring>
        </View>

        <View style={[styles.drawer, { backgroundColor: tokens.bg }]}>
          <View style={styles.header}>
            <CoachText style={[styles.title, { color: tokens.foreground }]}>
              Récupérer mes matchs officiels
            </CoachText>
            <PressableSpring onPress={onClose} hitSlop={10}>
              <Icon name="close" size={24} color={tokens.foreground} />
            </PressableSpring>
          </View>

          <CoachText style={[styles.subtitle, { color: tokens.muted }]}>
            Recherchez votre club et votre catégorie pour synchroniser automatiquement votre calendrier de championnat avec ProDay.
          </CoachText>

          <View style={[styles.searchContainer, { borderColor: tokens.border }]}>
            <Icon name="search" size={20} color={tokens.muted} />
            <TextInput
              style={[styles.searchInput, { color: tokens.foreground }]}
              placeholder="Ex: Torcy U16"
              placeholderTextColor={tokens.muted}
              value={query}
              onChangeText={handleSearch}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={tokens.accent} />}
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {results.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <PressableSpring
                  key={team.id}
                  style={[
                    styles.resultItem,
                    { borderColor: isSelected ? tokens.accent : tokens.border },
                    isSelected && { backgroundColor: tokens.accent + '11' }
                  ]}
                  onPress={() => setSelectedTeam(team)}
                >
                  <View style={styles.resultInfo}>
                    <CoachText style={[styles.resultName, { color: tokens.foreground }]}>
                      {team.name}
                    </CoachText>
                    <CoachText style={[styles.resultMeta, { color: tokens.muted }]}>
                      {team.category} • {team.division} ({team.poule})
                    </CoachText>
                  </View>
                  {isSelected && (
                    <Icon name="checkmark-circle" size={20} color={tokens.accent} />
                  )}
                </PressableSpring>
              );
            })}
            {!searching && query.length > 2 && results.length === 0 && (
              <CoachText style={[styles.noResult, { color: tokens.muted }]}>
                Aucun championnat trouvé.
              </CoachText>
            )}
          </ScrollView>

          {selectedTeam && (
            <View style={styles.autoSyncContainer}>
              <View style={styles.autoSyncText}>
                <CoachText style={[styles.autoSyncTitle, { color: tokens.foreground }]}>
                  Synchronisation automatique
                </CoachText>
                <CoachText style={[styles.autoSyncDesc, { color: tokens.muted }]}>
                  Actualiser les scores et reports de matchs chaque semaine.
                </CoachText>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: tokens.border, true: tokens.accent }}
              />
            </View>
          )}

          <View style={[styles.footer, { borderTopColor: tokens.border }]}>
            <PressableSpring
              style={[
                styles.importBtn,
                { backgroundColor: selectedTeam ? tokens.accent : tokens.border },
              ]}
              disabled={!selectedTeam}
              onPress={handleImport}
            >
              <CoachText style={[styles.importBtnText, { color: selectedTeam ? tokens.onAccent : tokens.muted }]}>
                Lier ce championnat
              </CoachText>
            </PressableSpring>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 50,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    minHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  noResult: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  autoSyncContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  autoSyncText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  autoSyncTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  autoSyncDesc: {
    fontSize: 12,
  },

  footer: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingBottom: 40,
  },
  importBtn: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
