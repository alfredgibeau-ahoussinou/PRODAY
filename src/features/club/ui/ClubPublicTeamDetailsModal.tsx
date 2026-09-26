import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import type { PublicTeamSportingRecord } from './clubStandingsModel';
import { prodayHaptics } from '../../../utils/prodayHaptics';

interface ClubPublicTeamDetailsModalProps {
  visible: boolean;
  record: PublicTeamSportingRecord | null;
  tokens: ClubThemeTokens;
  onClose: () => void;
  onOpenStandings?: (competitionName: string) => void;
}

export const ClubPublicTeamDetailsModal: React.FC<ClubPublicTeamDetailsModalProps> = ({
  visible,
  record,
  tokens,
  onClose,
  onOpenStandings,
}) => {
  if (!record) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={[styles.dialogCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: tokens.border }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Icon name="shield" size={13} color="#10B981" />
                <ProDayText style={[styles.badgeText, { color: '#10B981' }]}>
                  Fiche Publique Homologuée FFF
                </ProDayText>
              </View>
              <ProDayText style={[styles.teamTitle, { color: tokens.foreground }]} numberOfLines={1}>
                {record.teamName}
              </ProDayText>
              <ProDayText style={[styles.clubSubtitle, { color: tokens.muted }]} numberOfLines={1}>
                {record.clubName} {record.category ? `· ${record.category}` : ''}
              </ProDayText>
            </View>

            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                onClose();
              }}
              style={[styles.closeBtn, { borderColor: tokens.border }]}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={18} color={tokens.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Compétition & Poule */}
            <View style={[styles.compBox, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
              <Icon name="trophy" size={14} color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <ProDayText style={[styles.compTitle, { color: tokens.foreground }]}>
                  {record.competitionName}
                </ProDayText>
                {record.groupLabel ? (
                  <ProDayText style={[styles.compGroup, { color: tokens.muted }]}>
                    {record.groupLabel}
                  </ProDayText>
                ) : null}
              </View>
              {record.rank != null ? (
                <View style={[styles.rankBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                  <ProDayText style={[styles.rankNum, { color: tokens.accent }]}>
                    #{record.rank}
                  </ProDayText>
                  <ProDayText style={[styles.rankLabel, { color: tokens.muted }]}>
                    RANG
                  </ProDayText>
                </View>
              ) : null}
            </View>

            {/* Statistiques sportives publiques */}
            {record.isKnockout ? (
              <View style={[styles.knockoutNotice, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <Icon name="alert-circle" size={16} color="#F59E0B" />
                <ProDayText style={[styles.knockoutText, { color: tokens.muted }]}>
                  Épreuve à élimination directe (Coupe) : aucun classement par points applicable.
                </ProDayText>
              </View>
            ) : (
              <View style={[styles.statsGrid, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <View style={styles.statCell}>
                  <ProDayText style={[styles.statCellNum, { color: tokens.accent }]}>
                    {record.points ?? '—'}
                  </ProDayText>
                  <ProDayText style={[styles.statCellLabel, { color: tokens.muted }]}>POINTS</ProDayText>
                </View>
                <View style={styles.statCell}>
                  <ProDayText style={[styles.statCellNum, { color: tokens.foreground }]}>
                    {record.played ?? '—'}
                  </ProDayText>
                  <ProDayText style={[styles.statCellLabel, { color: tokens.muted }]}>JOUÉS</ProDayText>
                </View>
                <View style={styles.statCell}>
                  <ProDayText style={[styles.statCellNum, { color: '#10B981' }]}>
                    {record.won ?? '—'}
                  </ProDayText>
                  <ProDayText style={[styles.statCellLabel, { color: tokens.muted }]}>VICTOIRES</ProDayText>
                </View>
                <View style={styles.statCell}>
                  <ProDayText style={[styles.statCellNum, { color: '#F59E0B' }]}>
                    {record.drawn ?? '—'}
                  </ProDayText>
                  <ProDayText style={[styles.statCellLabel, { color: tokens.muted }]}>NULS</ProDayText>
                </View>
                <View style={styles.statCell}>
                  <ProDayText style={[styles.statCellNum, { color: '#EF4444' }]}>
                    {record.lost ?? '—'}
                  </ProDayText>
                  <ProDayText style={[styles.statCellLabel, { color: tokens.muted }]}>DÉFAITES</ProDayText>
                </View>
                <View style={styles.statCell}>
                  <ProDayText
                    style={[
                      styles.statCellNum,
                      record.goalDiff != null && record.goalDiff > 0
                        ? { color: '#10B981' }
                        : record.goalDiff != null && record.goalDiff < 0
                        ? { color: '#EF4444' }
                        : { color: tokens.muted },
                    ]}
                  >
                    {record.goalDiff != null ? (record.goalDiff > 0 ? `+${record.goalDiff}` : record.goalDiff) : '—'}
                  </ProDayText>
                  <ProDayText style={[styles.statCellLabel, { color: tokens.muted }]}>DIFF.</ProDayText>
                </View>
              </View>
            )}

            {/* Série de Forme */}
            {record.form && record.form.length > 0 ? (
              <View style={styles.formSection}>
                <ProDayText style={[styles.sectionTitle, { color: tokens.muted }]}>
                  Série récente :
                </ProDayText>
                <View style={styles.formRow}>
                  {record.form.map((f, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.formDot,
                        f === 'V'
                          ? { backgroundColor: '#10B981' }
                          : f === 'N'
                          ? { backgroundColor: '#F59E0B' }
                          : { backgroundColor: '#EF4444' },
                      ]}
                    >
                      <ProDayText style={styles.formDotText}>{f}</ProDayText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Note de confidentialité & RGPD FFF */}
            <View style={[styles.privacyBox, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: tokens.border }]}>
              <Icon name="lock" size={13} color={tokens.muted} />
              <ProDayText style={[styles.privacyText, { color: tokens.muted }]}>
                Données sportives publiques FFF uniquement. Les effectifs complets, numéros de licence et coordonnées de contact sont strictement réservés aux membres habilités du club.
              </ProDayText>
            </View>
          </ScrollView>

          {/* Boutons d'action */}
          <View style={[styles.footerRow, { borderTopColor: tokens.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: tokens.border }]}
            >
              <ProDayText style={[styles.cancelBtnText, { color: tokens.muted }]}>
                Fermer
              </ProDayText>
            </TouchableOpacity>

            {onOpenStandings && !record.isKnockout ? (
              <PressableSpring
                onPress={() => {
                  prodayHaptics.press();
                  onClose();
                  onOpenStandings(record.competitionName);
                }}
                style={[styles.primaryBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.96}
              >
                <ProDayText style={styles.primaryBtnText}>
                  Voir la poule complète
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  clubSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  scrollBody: {
    padding: 16,
  },
  compBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  compTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  compGroup: {
    fontSize: 11,
    marginTop: 2,
  },
  rankBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
  },
  rankNum: {
    fontSize: 14,
    fontWeight: '900',
  },
  rankLabel: {
    fontSize: 8,
    fontWeight: '700',
  },
  knockoutNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  knockoutText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: clubRadius.md,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  statCell: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statCellNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  statCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  formSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  formDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
    marginBottom: 6,
  },
  privacyText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: clubRadius.sm,
    borderWidth: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: clubRadius.sm,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
});
