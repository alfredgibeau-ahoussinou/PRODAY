import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING, useEliteResponsive } from '../../theme/prodayEliteTheme';
import { EliteCard } from '../ui/EliteCard';
import { EliteBadge } from '../ui/EliteBadge';
import { Icon } from '../ui/Icon';
import {
  fffScraperService,
  OFFICIAL_FFF_LEAGUES,
  type FffLeagueDataset,
} from '../../services/fffScraper.service';

export interface LeagueStandingItem {
  rank: number;
  clubId: string;
  clubName: string;
  logoUrl?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  diff: number;
  points: number;
  form: ('V' | 'N' | 'D')[];
  isUserClub?: boolean;
}

export interface TopScorerItem {
  rank: number;
  playerId: string;
  name: string;
  clubName: string;
  goals: number;
  matches: number;
  photoUrl?: string;
}

interface Props {
  leagueName?: string;
  standings?: LeagueStandingItem[];
  scorers?: TopScorerItem[];
  onTeamPress?: (teamId: string) => void;
  onScorerPress?: (playerId: string) => void;
}

export const EliteStandingsBoard: React.FC<Props> = ({
  onTeamPress,
  onScorerPress,
}) => {
  const [tab, setTab] = useState<'standings' | 'scorers'>('standings');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('d1-idf');
  const [dataset, setDataset] = useState<FffLeagueDataset>(OFFICIAL_FFF_LEAGUES['d1-idf']);
  const [isScraping, setIsScraping] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapeUrlInput, setScrapeUrlInput] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const { isMobile, containerStyle } = useEliteResponsive();

  useEffect(() => {
    void (async () => {
      const data = await fffScraperService.getLeagueStandings(selectedLeagueId);
      setDataset(data);
    })();
  }, [selectedLeagueId]);

  const handleSelectLeague = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    if (OFFICIAL_FFF_LEAGUES[leagueId]) {
      setDataset(OFFICIAL_FFF_LEAGUES[leagueId]);
    }
  };

  const handleLiveScrape = async () => {
    if (!scrapeUrlInput.trim()) {
      Alert.alert('Lien manquant', 'Veuillez entrer une URL de compétition FFF.');
      return;
    }

    setIsScraping(true);
    try {
      const scraped = await fffScraperService.scrapeFffUrl(scrapeUrlInput);
      setDataset(scraped);
      setShowScrapeModal(false);
      setSyncStatus('✓ Données FFF synchronisées avec succès !');
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      Alert.alert('Erreur de scraping', err?.message || 'Impossible de scraper cette URL FFF.');
    } finally {
      setIsScraping(false);
    }
  };

  const renderFormBadge = (result: 'V' | 'N' | 'D', index: number) => {
    const bg = result === 'V' ? ELITE_COLORS.primary : result === 'N' ? '#94A3B8' : ELITE_COLORS.danger;
    return (
      <View key={index} style={[styles.formDot, { backgroundColor: bg }]}>
        <Text style={styles.formText}>{result}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Barre de Source Officielle FFF */}
      <View style={styles.sourceBar}>
        <View style={styles.sourceIndicator}>
          <View style={styles.sourceDot} />
          <Text style={styles.sourceText}>DONNÉES OFFICIELLES FFF EN DIRECT</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowScrapeModal(true)}
          style={styles.scrapeBtn}
        >
          <Icon name="globe" size={13} color="#00E676" />
          <Text style={styles.scrapeBtnText}>Scraper ma poule</Text>
        </TouchableOpacity>
      </View>

      {syncStatus ? (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>{syncStatus}</Text>
        </View>
      ) : null}

      {/* Sélecteur de ligues officielles réelles */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leagueScroll}>
        <View style={styles.leaguePills}>
          <TouchableOpacity
            style={[styles.leaguePill, selectedLeagueId === 'd1-idf' && styles.leaguePillActive]}
            onPress={() => handleSelectLeague('d1-idf')}
          >
            <Text style={[styles.leaguePillText, selectedLeagueId === 'd1-idf' && styles.leaguePillTextActive]}>
              D1 Hauts-de-Seine (92)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.leaguePill, selectedLeagueId === 'r1-idf' && styles.leaguePillActive]}
            onPress={() => handleSelectLeague('r1-idf')}
          >
            <Text style={[styles.leaguePillText, selectedLeagueId === 'r1-idf' && styles.leaguePillTextActive]}>
              R1 Paris Île-de-France
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.leaguePill, selectedLeagueId === 'n3-groupe-h' && styles.leaguePillActive]}
            onPress={() => handleSelectLeague('n3-groupe-h')}
          >
            <Text style={[styles.leaguePillText, selectedLeagueId === 'n3-groupe-h' && styles.leaguePillTextActive]}>
              National 3 (Groupe H)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sélecteur d'onglet style FFF / MyCoach */}
      <View style={styles.segmentNav}>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'standings' && styles.segmentBtnActive]}
          onPress={() => setTab('standings')}
        >
          <Icon name="trophy" size={16} color={tab === 'standings' ? ELITE_COLORS.textPrimary : ELITE_COLORS.textSecondary} />
          <Text style={[styles.segmentText, tab === 'standings' && styles.segmentTextActive]}>
            Classement Officiel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'scorers' && styles.segmentBtnActive]}
          onPress={() => setTab('scorers')}
        >
          <Icon name="football" size={16} color={tab === 'scorers' ? ELITE_COLORS.textPrimary : ELITE_COLORS.textSecondary} />
          <Text style={[styles.segmentText, tab === 'scorers' && styles.segmentTextActive]}>
            Meilleurs Buteurs
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.leagueTitle}>{dataset.leagueName}</Text>
        <Text style={styles.updatedHint}>{dataset.lastUpdated}</Text>
      </View>

      {tab === 'standings' ? (
        <EliteCard padding="sm" style={styles.card}>
          {/* Header du tableau */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colRank, styles.headerLabel]}>RG</Text>
            <Text style={[styles.colClub, styles.headerLabel]}>CLUB</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>J</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>V</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>N</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>D</Text>
            <Text style={[styles.colStat, styles.headerLabel]}>DIFF</Text>
            <Text style={[styles.colPts, styles.headerLabel]}>PTS</Text>
            {!isMobile && <Text style={[styles.colForm, styles.headerLabel]}>FORME</Text>}
          </View>

          {/* Lignes du classement */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {dataset.standings.map((item) => {
              const isPromotion = item.rank <= 2;
              const isRelegation = item.rank >= 11;
              const isUserClub = item.isUserClub;

              return (
                <TouchableOpacity
                  key={item.clubId}
                  activeOpacity={0.7}
                  onPress={() => onTeamPress?.(item.clubId)}
                  style={[styles.row, isUserClub && styles.userRow]}
                >
                  <View style={styles.rankContainer}>
                    <View
                      style={[
                        styles.rankIndicator,
                        isPromotion && { backgroundColor: ELITE_COLORS.primary },
                        isRelegation && { backgroundColor: ELITE_COLORS.danger },
                      ]}
                    />
                    <Text style={[styles.rankText, isUserClub && { color: ELITE_COLORS.gold, fontWeight: '900' }]}>
                      {item.rank}
                    </Text>
                  </View>

                  <View style={styles.clubContainer}>
                    <Text
                      style={[styles.clubName, isUserClub && { color: ELITE_COLORS.gold, fontWeight: '800' }]}
                      numberOfLines={1}
                    >
                      {item.clubName}
                    </Text>
                  </View>

                  <Text style={styles.statText}>{item.played}</Text>
                  <Text style={styles.statText}>{item.won}</Text>
                  <Text style={styles.statText}>{item.drawn}</Text>
                  <Text style={styles.statText}>{item.lost}</Text>
                  <Text
                    style={[
                      styles.statText,
                      {
                        color:
                          item.diff > 0
                            ? ELITE_COLORS.primary
                            : item.diff < 0
                            ? ELITE_COLORS.danger
                            : ELITE_COLORS.textSecondary,
                      },
                    ]}
                  >
                    {item.diff > 0 ? `+${item.diff}` : item.diff}
                  </Text>
                  <Text style={[styles.ptsText, isUserClub && { color: ELITE_COLORS.gold }]}>
                    {item.points}
                  </Text>

                  {!isMobile && (
                    <View style={styles.formContainer}>
                      {item.form.slice(-5).map(renderFormBadge)}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Légende FFF */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: ELITE_COLORS.primary }]} />
              <Text style={styles.legendText}>Accession R3 / Régional</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: ELITE_COLORS.danger }]} />
              <Text style={styles.legendText}>Relégation District</Text>
            </View>
          </View>
        </EliteCard>
      ) : (
        <EliteCard padding="sm" style={styles.card}>
          {dataset.scorers.map((scorer) => (
            <TouchableOpacity
              key={scorer.playerId}
              activeOpacity={0.7}
              onPress={() => onScorerPress?.(scorer.playerId)}
              style={styles.scorerRow}
            >
              <View style={styles.scorerRank}>
                <Text style={styles.scorerRankText}>{scorer.rank}</Text>
              </View>
              <View style={styles.scorerInfo}>
                <Text style={styles.scorerName}>{scorer.name}</Text>
                <Text style={styles.scorerClub}>{scorer.clubName}</Text>
              </View>
              <View style={styles.scorerGoalsBlock}>
                <Text style={styles.scorerGoals}>{scorer.goals}</Text>
                <Text style={styles.scorerGoalsLabel}>BUTS ({scorer.matches} M)</Text>
              </View>
            </TouchableOpacity>
          ))}
        </EliteCard>
      )}

      {/* Modal de Scraping FFF */}
      <Modal visible={showScrapeModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scraper une Poule FFF en Direct</Text>
              <TouchableOpacity onPress={() => setShowScrapeModal(false)}>
                <Icon name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Collez l&apos;adresse web de votre poule FFF (ligue régionale ou district) pour importer en 1 seconde le vrai classement officiel de votre équipe.
            </Text>

            <TextInput
              style={styles.urlInput}
              placeholder="https://paris-idf.fff.fr/competitions/?id=..."
              placeholderTextColor="#64748B"
              value={scrapeUrlInput}
              onChangeText={setScrapeUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowScrapeModal(false)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmScrapeBtn}
                onPress={handleLiveScrape}
                disabled={isScraping}
              >
                {isScraping ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.confirmScrapeBtnText}>Lancer le Scraping ⚡</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: ELITE_SPACING.sm,
  },
  sourceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 0.5,
  },
  scrapeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  scrapeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
  },
  syncBanner: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  syncBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E676',
  },
  leagueScroll: {
    marginBottom: 10,
  },
  leaguePills: {
    flexDirection: 'row',
    gap: 8,
  },
  leaguePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#101522',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  leaguePillActive: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  leaguePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  leaguePillTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  segmentNav: {
    flexDirection: 'row',
    backgroundColor: '#101522',
    borderRadius: ELITE_RADIUS.md,
    padding: 3,
    marginBottom: ELITE_SPACING.sm,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: ELITE_RADIUS.sm,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#172033',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#00E676',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  leagueTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  updatedHint: {
    fontSize: 10,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#101522',
    borderColor: '#1E293B',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#101522',
  },
  userRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: ELITE_COLORS.gold,
  },
  rankContainer: {
    width: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankIndicator: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clubContainer: {
    flex: 1,
    paddingRight: 6,
  },
  clubName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  colRank: { width: 28 },
  colClub: { flex: 1, textAlign: 'left', paddingLeft: 6 },
  colStat: { width: 22 },
  colPts: { width: 32 },
  colForm: { width: 85 },
  statText: {
    width: 22,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  ptsText: {
    width: 32,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formContainer: {
    width: 85,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  formDot: {
    width: 15,
    height: 15,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  scorerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  scorerRankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  scorerInfo: {
    flex: 1,
  },
  scorerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scorerClub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  scorerGoalsBlock: {
    alignItems: 'flex-end',
  },
  scorerGoals: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00E676',
  },
  scorerGoalsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#101522',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  urlInput: {
    backgroundColor: '#080C14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmScrapeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  confirmScrapeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
});
