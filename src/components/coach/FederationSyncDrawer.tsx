import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import { CoachText } from './coachPortalUi';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../theme/designTokens';
import { federationService } from '../../services/federation.service';
import type { FederationClub, FederationChampionship, FederationCategory } from '../../models/Federation';

interface FederationSyncDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSyncComplete: (clubName: string) => void;
}

export function FederationSyncDrawer({
  visible,
  onClose,
  onSyncComplete,
}: FederationSyncDrawerProps) {
  const { tokens } = useCoachTheme();
  
  // Step State: 1: Search, 2: Select Champ, 3: Pick Team, 4: Sync Progress
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<FederationClub[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedClub, setSelectedClub] = useState<FederationClub | null>(null);

  // Step 2
  const [champs, setChamps] = useState<FederationChampionship[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FederationCategory>('Jeunes');
  const [selectedChamp, setSelectedChamp] = useState<FederationChampionship | null>(null);

  // Step 3
  const [selectedTeamNum, setSelectedTeamNum] = useState<string | null>(null);

  // Step 4
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{ importedCount: number; nextMatchStr: string } | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep(1);
        setQuery('');
        setClubs([]);
        setSelectedClub(null);
        setSelectedChamp(null);
        setSelectedTeamNum(null);
        setSyncProgress(0);
        setSyncResult(null);
      }, 300);
    }
  }, [visible]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      setSearching(true);
      const res = await federationService.searchClubs(text);
      setClubs(res);
      setSearching(false);
    } else {
      setClubs([]);
    }
  };

  const onSelectClub = async (club: FederationClub) => {
    setSelectedClub(club);
    setStep(2);
    setLoadingChamps(true);
    const res = await federationService.getClubChampionships(club.id);
    setChamps(res);
    setLoadingChamps(false);
  };

  const onSelectChamp = (champ: FederationChampionship) => {
    setSelectedChamp(champ);
    if (champ.teamsAvailable.length === 1) {
      setSelectedTeamNum(champ.teamsAvailable[0]);
      startSync(champ, champ.teamsAvailable[0]);
    } else {
      setStep(3);
    }
  };

  const onSelectTeamNum = (num: string) => {
    setSelectedTeamNum(num);
    if (selectedChamp) {
      startSync(selectedChamp, num);
    }
  };

  const startSync = async (champ: FederationChampionship, teamNum: string) => {
    setStep(4);
    setSyncProgress(0);
    const res = await federationService.triggerSync(
      selectedClub!.id,
      champ.id,
      teamNum,
      (pct) => setSyncProgress(pct)
    );
    setSyncResult(res);
  };

  const filteredChamps = champs.filter((c) => c.categoryTag === activeCategory);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.overlayBg}>
          <PressableSpring style={StyleSheet.absoluteFill} onPress={onClose}><View /></PressableSpring>
        </View>

        <View style={[styles.drawer, { backgroundColor: tokens.bg }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <CoachText style={[styles.title, { color: tokens.foreground }]}>
                Récupérer mes matchs officiels
              </CoachText>
              {step > 1 && selectedClub && (
                <CoachText style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                  {selectedClub.name} {selectedChamp ? `> ${selectedChamp.name}` : ''}
                </CoachText>
              )}
            </View>
            <PressableSpring onPress={onClose} hitSlop={10}>
              <Icon name="close" size={24} color={tokens.foreground} />
            </PressableSpring>
          </View>

          <View style={styles.contentArea}>
            {step === 1 && (
              <View>
                <View style={[styles.searchContainer, { borderColor: tokens.border }]}>
                  <Icon name="search" size={20} color={tokens.muted} />
                  <TextInput
                    style={[styles.searchInput, { color: tokens.foreground }]}
                    placeholder="Rechercher un club (ex: Torcy)"
                    placeholderTextColor={tokens.muted}
                    value={query}
                    onChangeText={handleSearch}
                    autoFocus
                  />
                  {searching && <ActivityIndicator size="small" color={tokens.accent} />}
                </View>
                <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                  {clubs.map((club) => (
                    <PressableSpring
                      key={club.id}
                      style={[styles.clubCard, { borderColor: tokens.border }]}
                      onPress={() => onSelectClub(club)}
                    >
                      {club.logoUrl ? (
                        <Image source={{ uri: club.logoUrl }} style={styles.clubLogo} />
                      ) : (
                        <View style={[styles.clubLogoPlaceholder, { backgroundColor: tokens.surface }]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <CoachText style={[styles.clubName, { color: tokens.foreground }]}>{club.name}</CoachText>
                        <CoachText style={[styles.clubCity, { color: tokens.muted }]}>{club.city}</CoachText>
                      </View>
                      <Icon name="chevron-forward" size={18} color={tokens.muted} />
                    </PressableSpring>
                  ))}
                  {!searching && query.length > 2 && clubs.length === 0 && (
                    <CoachText style={[styles.noResult, { color: tokens.muted }]}>
                      Aucun club trouvé dans la base fédérale.
                    </CoachText>
                  )}
                </ScrollView>
              </View>
            )}

            {step === 2 && (
              <View style={{ flex: 1 }}>
                <View style={styles.tabsRow}>
                  {(['Seniors', 'Jeunes', 'Féminines'] as FederationCategory[]).map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <PressableSpring
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={[
                          styles.tabBtn,
                          isActive ? { backgroundColor: tokens.accent } : { backgroundColor: tokens.surface }
                        ]}
                      >
                        <CoachText style={[styles.tabBtnText, { color: isActive ? tokens.onAccent : tokens.muted }]}>
                          {cat}
                        </CoachText>
                      </PressableSpring>
                    );
                  })}
                </View>

                {loadingChamps ? (
                  <View style={styles.centered}>
                    <ActivityIndicator size="large" color={tokens.accent} />
                  </View>
                ) : (
                  <ScrollView style={styles.list}>
                    {filteredChamps.map((champ) => (
                      <PressableSpring
                        key={champ.id}
                        style={[styles.champCard, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
                        onPress={() => onSelectChamp(champ)}
                      >
                        <View style={{ flex: 1 }}>
                          <CoachText style={[styles.champName, { color: tokens.foreground }]}>{champ.name} • {champ.division}</CoachText>
                          <CoachText style={[styles.champMeta, { color: tokens.accent }]}>{champ.poule}</CoachText>
                        </View>
                        <Icon name="chevron-forward" size={18} color={tokens.muted} />
                      </PressableSpring>
                    ))}
                    {filteredChamps.length === 0 && (
                      <CoachText style={[styles.noResult, { color: tokens.muted }]}>
                        Aucun championnat {activeCategory.toLowerCase()} engagé pour ce club.
                      </CoachText>
                    )}
                  </ScrollView>
                )}
              </View>
            )}

            {step === 3 && selectedChamp && (
              <View style={styles.centered}>
                <CoachText style={[styles.teamSelectTitle, { color: tokens.foreground }]}>
                  Quelle équipe gérez-vous ?
                </CoachText>
                <CoachText style={[styles.teamSelectSub, { color: tokens.muted }]}>
                  Plusieurs équipes sont engagées en {selectedChamp.name}.
                </CoachText>
                <View style={styles.teamGrid}>
                  {selectedChamp.teamsAvailable.map((num) => (
                    <PressableSpring
                      key={num}
                      style={[styles.teamGridBtn, { borderColor: tokens.accent, backgroundColor: tokens.surface }]}
                      onPress={() => onSelectTeamNum(num)}
                    >
                      <CoachText style={{ color: tokens.foreground, fontWeight: '700' }}>{num}</CoachText>
                    </PressableSpring>
                  ))}
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={styles.syncContainer}>
                {!syncResult ? (
                  <>
                    <ActivityIndicator size="large" color={tokens.accent} style={{ marginBottom: spacing.lg }} />
                    <CoachText style={[styles.syncingTitle, { color: tokens.foreground }]}>
                      Synchronisation FFF en cours... {syncProgress}%
                    </CoachText>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${syncProgress}%`, backgroundColor: tokens.accent }]} />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.successCircle, { backgroundColor: tokens.accent + '22' }]}>
                      <Icon name="checkmark-circle" size={40} color={tokens.accent} />
                    </View>
                    <CoachText style={[styles.successTitle, { color: tokens.foreground }]}>
                      {syncResult.importedCount} matchs importés pour la saison
                    </CoachText>
                    
                    <View style={[styles.nextMatchCard, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                      <CoachText style={{ fontSize: 10, fontWeight: '800', color: tokens.muted, textTransform: 'uppercase', marginBottom: 6 }}>
                        Prochain match officiel
                      </CoachText>
                      <CoachText style={{ fontSize: 14, fontWeight: '700', color: tokens.accent }}>
                        {syncResult.nextMatchStr}
                      </CoachText>
                    </View>

                    <View style={styles.autoSyncContainer}>
                      <View style={{ flex: 1, paddingRight: spacing.md }}>
                        <CoachText style={[styles.autoSyncTitle, { color: tokens.foreground }]}>
                          Mise à jour automatique
                        </CoachText>
                        <CoachText style={{ fontSize: 12, color: tokens.muted }}>
                          Actualiser les horaires et terrains chaque semaine.
                        </CoachText>
                      </View>
                      <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ false: tokens.border, true: tokens.accent }} />
                    </View>

                    <PressableSpring
                      style={[styles.doneBtn, { backgroundColor: tokens.accent }]}
                      onPress={() => {
                        onClose();
                        onSyncComplete(selectedClub?.name || "Équipe FFF");
                      }}
                    >
                      <CoachText style={{ color: tokens.onAccent, fontWeight: '800', fontSize: 16 }}>
                        Terminer
                      </CoachText>
                    </PressableSpring>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '800' },
  contentArea: { minHeight: 300 },
  
  // Step 1
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, height: 50, marginBottom: spacing.md },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 16, fontWeight: '500' },
  list: { flexGrow: 1, paddingBottom: spacing.xl },
  clubCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderRadius: radius.md, marginBottom: spacing.sm },
  clubLogo: { width: 40, height: 40, borderRadius: 8, marginRight: spacing.md },
  clubLogoPlaceholder: { width: 40, height: 40, borderRadius: 8, marginRight: spacing.md },
  clubName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  clubCity: { fontSize: 13, fontWeight: '500' },
  noResult: { textAlign: 'center', marginTop: spacing.xl, fontStyle: 'italic' },
  
  // Step 2
  tabsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  tabBtnText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  champCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderRadius: radius.md, marginBottom: spacing.sm },
  champName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  champMeta: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  
  // Step 3
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl },
  teamSelectTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.xs },
  teamSelectSub: { fontSize: 14, marginBottom: spacing.xl, textAlign: 'center' },
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  teamGridBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderWidth: 1, borderRadius: radius.lg },
  
  // Step 4
  syncContainer: { flex: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  syncingTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: spacing.md },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  successCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: spacing.lg },
  successTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: spacing.xl },
  nextMatchCard: { padding: spacing.md, borderWidth: 1, borderRadius: radius.lg, marginBottom: spacing.xl },
  autoSyncContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, paddingVertical: spacing.sm },
  autoSyncTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  doneBtn: { height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
