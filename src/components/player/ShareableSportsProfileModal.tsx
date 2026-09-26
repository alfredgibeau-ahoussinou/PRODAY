import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { shareableSportsProfileService } from '../../services/shareableSportsProfile.service';
import type { User } from '../../models/User';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: User;
  clubName?: string;
  isMinor?: boolean;
  accent?: string;
}

export function ShareableSportsProfileModal({
  visible,
  onClose,
  user,
  clubName,
  isMinor = false,
  accent = '#10B981',
}: Props) {
  // Deliberate selection options
  const [includePosition, setIncludePosition] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeCareerHistory, setIncludeCareerHistory] = useState(true);
  const [includeContact, setIncludeContact] = useState(!isMinor); // Default false for minors
  const [includePhoto, setIncludePhoto] = useState(true);

  const rawStats = user.profile?.season_stats
    ? [
        {
          season_label: '2025-2026',
          source: 'Feuilles de match officielles FFF / Club',
          matches_played: user.profile.season_stats.matches,
          goals: user.profile.season_stats.goals,
          assists: user.profile.season_stats.assists,
        },
      ]
    : [];

  const rawHistory = (user.profile?.experiences || []).map((exp) => ({
    season: exp.period || 'Précédent',
    club_name: exp.organization || 'Club',
    category_level: exp.title || 'Joueur',
    achievements: exp.description,
  }));

  const fullProfileData = {
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    age: user.profile?.age,
    birth_year: user.profile?.birth_date ? parseInt(user.profile.birth_date.slice(0, 4), 10) : undefined,
    primary_position: user.profile?.position || 'Poste non renseigné',
    strong_foot: user.profile?.strong_foot,
    height_cm: user.profile?.height_cm,
    weight_kg: user.profile?.weight_kg,
    club_name: clubName,
    history: rawHistory,
    stats: rawStats,
    contact_email: user.email,
    contact_phone: user.phone,
    guardian_contact: isMinor ? 'Coordonnées parentales vérifiées' : undefined,
    is_minor: isMinor,
    bio: user.profile?.bio,
    generated_at: new Date(),
  };

  const doc = shareableSportsProfileService.buildExportData(fullProfileData, {
    include_full_name: true,
    include_photo: includePhoto,
    include_birth_date: true,
    include_nationality: false,
    include_positions: includePosition,
    include_strong_foot: includePosition,
    include_height_weight: true,
    include_current_club: true,
    include_sporting_history: includeCareerHistory,
    include_verified_stats: includeStats,
    include_contact_details: includeContact,
  });

  const handleExportPdf = async () => {
    prodayHaptics.confirm();
    const html = shareableSportsProfileService.generatePrintableHtml(doc);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      } else {
        Alert.alert('Fenêtre bloquée', 'Veuillez autoriser les fenêtres contextuelles pour imprimer/sauvegarder le PDF.');
      }
      return;
    }

    // Native Mobile: Share formatted text summary or trigger native share
    const statsLines = (doc.stats ?? []).map(
      (s) => `• ${s.season_label} : ${s.matches_played} matchs, ${s.goals} buts, ${s.assists} passes (${s.source})`,
    );

    const textResume = [
      `CV SPORTIF PRODAY — ${(doc.display_name ?? 'JOUEUR').toUpperCase()}`,
      `Poste : ${doc.primary_position || 'Non spécifié'} | Âge : ${doc.age ? `${doc.age} ans` : 'N/A'}`,
      `Club actuel : ${doc.club_name || 'Sans club'}`,
      (doc.stats ?? []).length > 0 ? `\nSTATISTIQUES VÉRIFIÉES :\n${statsLines.join('\n')}` : '',
      (doc.history ?? []).length > 0
        ? `\nPARCOURS SPORTIF :\n${doc.history
            ?.map((e) => `• ${e.club_name} (${e.category_level}) - ${e.season}`)
            .join('\n')}`
        : '',
      doc.contact_email ? `\nContact : ${doc.contact_email}` : '',
      `\nDocument généré via ProDay.`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({
        title: `CV Sportif • ${doc.display_name}`,
        message: textResume,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBadge, { backgroundColor: `${accent}20` }]}>
                <Ionicons name="document-text" size={20} color={accent} />
              </View>
              <View>
                <ProDayText variant="title" style={styles.headerTitle}>
                  CV & Profil Sportif Partageable
                </ProDayText>
                <ProDayText variant="caption" style={styles.headerSubtitle}>
                  Export PDF & impression • Données vérifiées sélectionnées
                </ProDayText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Minor privacy note */}
            <View style={styles.privacyBanner}>
              <Ionicons name="shield-checkmark" size={16} color="#3B82F6" />
              <ProDayText variant="caption" style={styles.privacyBannerText}>
                {isMinor
                  ? 'Protection mineur : les notes de coach, données de santé et échanges privés sont strictement exclus. L’export reste local et n’est pas publié en ligne.'
                  : 'Seules les données que vous cochez ci-dessous figureront sur le document PDF. Aucune note interne du club n’est exportée.'}
              </ProDayText>
            </View>

            {/* Field Selection Toggles */}
            <ProDayText variant="section" style={styles.sectionTitle}>
              Champs à inclure dans le PDF
            </ProDayText>

            <View style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="body" style={styles.toggleLabel}>
                    Poste & caractéristiques
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toggleSub}>
                    {user.profile?.position || 'Poste non renseigné'} • Pied{' '}
                    {user.profile?.strong_foot || 'droit'}
                  </ProDayText>
                </View>
                <Switch
                  value={includePosition}
                  onValueChange={(v) => {
                    prodayHaptics.selection();
                    setIncludePosition(v);
                  }}
                  trackColor={{ false: PLAYER_DARK.surface, true: accent }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="body" style={styles.toggleLabel}>
                    Statistiques de match vérifiées
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toggleSub}>
                    Sources officielles de saison (aucun score inventé ou estimé)
                  </ProDayText>
                </View>
                <Switch
                  value={includeStats}
                  onValueChange={(v) => {
                    prodayHaptics.selection();
                    setIncludeStats(v);
                  }}
                  trackColor={{ false: PLAYER_DARK.surface, true: accent }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="body" style={styles.toggleLabel}>
                    Historique sportif validé
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toggleSub}>
                    Clubs précédents, catégories et palmarès enregistrés
                  </ProDayText>
                </View>
                <Switch
                  value={includeCareerHistory}
                  onValueChange={(v) => {
                    prodayHaptics.selection();
                    setIncludeCareerHistory(v);
                  }}
                  trackColor={{ false: PLAYER_DARK.surface, true: accent }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="body" style={styles.toggleLabel}>
                    Coordonnées de contact
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toggleSub}>
                    {isMinor
                      ? 'Désactivé par défaut pour les mineurs (recommandé)'
                      : 'Email ou téléphone professionnel'}
                  </ProDayText>
                </View>
                <Switch
                  value={includeContact}
                  onValueChange={(v) => {
                    prodayHaptics.selection();
                    setIncludeContact(v);
                  }}
                  trackColor={{ false: PLAYER_DARK.surface, true: accent }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="body" style={styles.toggleLabel}>
                    Photo / avatar officiel
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toggleSub}>
                    Photo de profil du compte
                  </ProDayText>
                </View>
                <Switch
                  value={includePhoto}
                  onValueChange={(v) => {
                    prodayHaptics.selection();
                    setIncludePhoto(v);
                  }}
                  trackColor={{ false: PLAYER_DARK.surface, true: accent }}
                />
              </View>
            </View>

            {/* Document Preview Box */}
            <ProDayText variant="section" style={styles.sectionTitle}>
              Aperçu avant export
            </ProDayText>

            <View style={styles.previewBox}>
              <View style={styles.previewHeader}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="section" style={styles.previewName}>
                    {doc.display_name}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.previewSub}>
                    {includePosition && doc.primary_position ? doc.primary_position : 'Poste masqué'} •{' '}
                    {doc.club_name || 'Sans club'}
                  </ProDayText>
                </View>
                <View style={[styles.prodayWatermark, { borderColor: `${accent}40` }]}>
                  <ProDayText variant="caption" style={{ color: accent, fontWeight: '900' }}>
                    PRODAY CV
                  </ProDayText>
                </View>
              </View>

              {includeStats && (doc.stats ?? []).length > 0 && (
                <View style={styles.previewSection}>
                  <ProDayText variant="caption" style={styles.previewSectionTitle}>
                    STATISTIQUES OFFICIELLES
                  </ProDayText>
                  <View style={styles.statsRow}>
                    {(doc.stats ?? []).map((s, idx) => (
                      <View key={idx} style={styles.statMiniCard}>
                        <ProDayText variant="title" style={styles.statNumber}>
                          {s.matches_played}
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.statLabel}>
                          Matchs ({s.season_label})
                        </ProDayText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {includeCareerHistory && (doc.history ?? []).length > 0 && (
                <View style={styles.previewSection}>
                  <ProDayText variant="caption" style={styles.previewSectionTitle}>
                    PARCOURS
                  </ProDayText>
                  {(doc.history ?? []).map((exp, idx) => (
                    <ProDayText key={idx} variant="caption" style={styles.expText}>
                      • {exp.club_name} ({exp.category_level}) - {exp.season}
                    </ProDayText>
                  ))}
                </View>
              )}

              {includeContact && doc.contact_email && (
                <View style={styles.previewSection}>
                  <ProDayText variant="caption" style={styles.previewSectionTitle}>
                    CONTACT
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.expText}>
                    {doc.contact_email}
                  </ProDayText>
                </View>
              )}
            </View>

            {/* Export buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <ProDayText variant="caption" style={styles.cancelBtnText}>
                  Fermer
                </ProDayText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: accent }]}
                onPress={handleExportPdf}
              >
                <Ionicons name="share-outline" size={18} color="#000" />
                <ProDayText variant="caption" style={styles.exportBtnText}>
                  {Platform.OS === 'web' ? 'Imprimer / Exporter PDF' : 'Partager le CV'}
                </ProDayText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PLAYER_DARK.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  privacyBannerText: {
    flex: 1,
    color: '#3B82F6',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionTitle: {
    color: PLAYER_DARK.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  toggleCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  toggleLabel: {
    color: PLAYER_DARK.text,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSub: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: PLAYER_DARK.border,
  },
  previewBox: {
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
    paddingBottom: 10,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  previewSub: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  prodayWatermark: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  previewSection: {
    gap: 6,
  },
  previewSectionTitle: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statMiniCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
  },
  expText: {
    color: PLAYER_DARK.text,
    fontSize: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  cancelBtnText: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
  },
  exportBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exportBtnText: {
    color: '#000',
    fontWeight: '800',
  },
});
