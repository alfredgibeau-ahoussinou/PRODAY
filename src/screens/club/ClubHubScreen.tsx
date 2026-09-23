/**
 * Pôle Club — Hub Gouvernance & Identité Club (ClubHubScreen)
 * Architecture Apple Obsidian Glass · Zéro code legacy · Zéro émoji unicode.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubLogoUpload } from '../../features/club/hooks/useClubLogoUpload';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import {
  ClubChapterScroll,
  ClubLoading,
} from '../../features/club/ui/clubUi';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { ProDayText } from '../../components/ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { ShellAccountSection } from '../../components/shell/ShellAccountSection';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';
import { ClubBrandColorsPanel } from '../../features/club/ui/ClubBrandColorsPanel';
import { ClubQuoteRequestScreen } from './ClubQuoteRequestScreen';
import { VeoConnectionPanel } from '../../components/club/VeoConnectionPanel';

export function ClubHubScreen() {
  const shellNav = useClubShellNav();
  const { tokens, logoUrl, brand } = useClubTheme();
  const ws = useClubWorkspace();
  const { confirmDeleteAccount } = useAccountDeletion();
  const [showQuoteRequest, setShowQuoteRequest] = useState(false);

  const onBrandUpdated = useCallback(() => {
    void ws.refresh();
  }, [ws]);
  const logo = useClubLogoUpload(onBrandUpdated);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const clubName = ws.club?.name ?? 'ProDay Football Club';
  const crestLetter = (clubName.trim().charAt(0) || 'C').toUpperCase();
  const city = ws.club?.city ?? 'Paris';
  const dept = ws.club?.department ?? '75';

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        {/* 1. HERO IDENTITÉ OFFICIELLE & BLASON STUDIO */}
        <View style={[styles.identityCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.005)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.identityTop}>
            <PressableSpring
              onPress={logo.canEdit ? () => void logo.pickAndUpload() : undefined}
              scaleTo={0.96}
              style={[styles.crestContainer, { borderColor: `${tokens.accent}50` }]}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.crestImg} resizeMode="cover" />
              ) : (
                <View style={[styles.crestPlaceholder, { backgroundColor: tokens.elevated }]}>
                  <ProDayText style={[styles.crestText, { color: tokens.accent }]}>
                    {crestLetter}
                  </ProDayText>
                </View>
              )}
              {logo.canEdit ? (
                <View style={[styles.cameraBadge, { backgroundColor: tokens.accent }]}>
                  <Icon name="camera" size={12} color="#000000" />
                </View>
              ) : null}
            </PressableSpring>

            <View style={styles.identityMeta}>
              <View style={[styles.fffBadge, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
                <Icon name="shield" size={12} color={tokens.accent} />
                <ProDayText style={[styles.fffBadgeText, { color: tokens.accent }]}>
                  Affiliation FFF Homologuée
                </ProDayText>
              </View>

              <ProDayText style={[styles.clubName, { color: tokens.foreground }]} numberOfLines={1}>
                {clubName}
              </ProDayText>

              <ProDayText style={[styles.clubSub, { color: tokens.muted }]}>
                {city} · Dép. {dept} · Saison 2026/2027
              </ProDayText>
            </View>
          </View>

          {/* Raccourcis Gouvernance */}
          <View style={[styles.gouvernanceRow, { borderTopColor: tokens.border }]}>
            <PressableSpring
              onPress={() => shellNav?.openPresident?.()}
              style={[styles.govBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
              scaleTo={0.96}
            >
              <Icon name="business" size={15} color={tokens.accent} />
              <ProDayText style={[styles.govBtnText, { color: tokens.foreground }]}>
                Pôle Président
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => shellNav?.requestNav('permissions')}
              style={[styles.govBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
              scaleTo={0.96}
            >
              <Icon name="shield" size={15} color={tokens.foreground} />
              <ProDayText style={[styles.govBtnText, { color: tokens.foreground }]}>
                Droits & Staff
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => shellNav?.requestNav('finances')}
              style={[styles.govBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
              scaleTo={0.96}
            >
              <Icon name="bag" size={15} color={tokens.foreground} />
              <ProDayText style={[styles.govBtnText, { color: tokens.foreground }]}>
                Trésorerie
              </ProDayText>
            </PressableSpring>
          </View>
        </View>

        {/* 2. STRUCTURE & EFFECTIFS DU CLUB (3 PILIERS) */}
        <View style={styles.sectionHeader}>
          <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
            Structure Officielle du Club
          </ProDayText>
          <ProDayText style={[styles.sectionSubtitle, { color: tokens.muted }]}>
            Gestion globale des effectifs et des installations
          </ProDayText>
        </View>

        <View style={styles.structureGrid}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('players')}
            style={[styles.structureCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.97}
          >
            <View style={[styles.structureIconBox, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="people" size={18} color={tokens.accent} />
            </View>
            <ProDayText style={[styles.structureNum, { color: tokens.foreground }]}>
              {ws.players.length || 24}
            </ProDayText>
            <ProDayText style={[styles.structureLabel, { color: tokens.foreground }]}>
              Licenciés Joueurs
            </ProDayText>
            <ProDayText style={[styles.structureSub, { color: tokens.muted }]}>
              Effectif actif FFF
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => shellNav?.requestNav('teams')}
            style={[styles.structureCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.97}
          >
            <View style={[styles.structureIconBox, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="shirt" size={18} color={tokens.accent} />
            </View>
            <ProDayText style={[styles.structureNum, { color: tokens.foreground }]}>
              {ws.teams.length || 3}
            </ProDayText>
            <ProDayText style={[styles.structureLabel, { color: tokens.foreground }]}>
              Équipes Engagées
            </ProDayText>
            <ProDayText style={[styles.structureSub, { color: tokens.muted }]}>
              U7 à Seniors R1
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => shellNav?.requestNav('coaches')}
            style={[styles.structureCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.97}
          >
            <View style={[styles.structureIconBox, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="school" size={18} color={tokens.accent} />
            </View>
            <ProDayText style={[styles.structureNum, { color: tokens.foreground }]}>
              {ws.coaches.length || 2}
            </ProDayText>
            <ProDayText style={[styles.structureLabel, { color: tokens.foreground }]}>
              Staff Technique
            </ProDayText>
            <ProDayText style={[styles.structureSub, { color: tokens.muted }]}>
              Éducateurs FFF
            </ProDayText>
          </PressableSpring>
        </View>

        {/* 3. CHARTE GRAPHIQUE & COULEURS OFFICIELLES */}
        <View style={styles.sectionHeader}>
          <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
            Charte & Couleurs du Club
          </ProDayText>
          <ProDayText style={[styles.sectionSubtitle, { color: tokens.muted }]}>
            Personnalisation de l'application aux couleurs de votre blason
          </ProDayText>
        </View>

        <ClubBrandColorsPanel onSaved={onBrandUpdated} />

        {/* 4. FORMULE PRODAY OFFICIELLE (PACK CLUB) */}
        <View style={[styles.packCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.packTop}>
            <View style={[styles.packBadge, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="star" size={14} color={tokens.accent} />
              <ProDayText style={[styles.packBadgeText, { color: tokens.accent }]}>
                Offre Club Dédiée
              </ProDayText>
            </View>
            <ProDayText style={[styles.packPrice, { color: tokens.foreground }]}>
              Sur Devis
            </ProDayText>
          </View>

          <ProDayText style={[styles.packTitle, { color: tokens.foreground }]}>
            Pack Club ProDay · Déploiement Clé en Main
          </ProDayText>

          <ProDayText style={[styles.packDesc, { color: tokens.muted }]}>
            Importation automatique Footclubs FFF, formation en direct du comité et des éducateurs, gestion illimitée des effectifs, arbitres et convocations.
          </ProDayText>

          <PressableSpring
            onPress={() => setShowQuoteRequest(true)}
            style={[styles.quoteBtn, { backgroundColor: tokens.accent }]}
            scaleTo={0.97}
          >
            <ProDayText style={styles.quoteBtnText}>
              Demander un Devis Personnalisé
            </ProDayText>
          </PressableSpring>
        </View>

        {/* 5. GESTION ADMINISTRATIVE & CONFORMITÉ APPLE */}
        <ShellAccountSection
          tone={{
            foreground: tokens.foreground,
            muted: tokens.muted,
            faint: tokens.faint,
            surface: tokens.surface,
            border: tokens.border,
            destructive: '#EF4444',
            iconBg: tokens.elevated,
          }}
          onSignOut={shellNav?.signOut}
          onDeleteAccount={confirmDeleteAccount}
          safeBottom
        />

        <View style={{ height: 40 }} />
      </ClubChapterScroll>

      {/* Modal Devis Club */}
      <Modal
        visible={showQuoteRequest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuoteRequest(false)}
      >
        <ClubQuoteRequestScreen onBack={() => setShowQuoteRequest(false)} />
      </Modal>
    </View>
  );
}

export function ClubPackScreen() {
  const { tokens } = useClubTheme();
  const { clubId: packClubId } = useClubWorkspace();
  const [showQuoteRequest, setShowQuoteRequest] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ClubChapterScroll>
        <View style={{ gap: 16 }}>
          <ProDayText style={[APPLE_TYPOGRAPHY.title1, { color: tokens.foreground }]}>
            Paramètres club
          </ProDayText>
          <ProDayText style={[APPLE_TYPOGRAPHY.footnote, { color: tokens.muted }]}>
            Connexions, formule officielle et services du club.
          </ProDayText>

          <VeoConnectionPanel clubId={packClubId ?? undefined} />

          <ProDayText style={[APPLE_TYPOGRAPHY.title3, { color: tokens.foreground, marginTop: 8 }]}>
            Pack Club ProDay
          </ProDayText>
          <ProDayText style={[APPLE_TYPOGRAPHY.footnote, { color: tokens.muted }]}>
            Formule officielle tout-en-un sur mesure pour clubs de football.
          </ProDayText>
          <View
            style={{
              backgroundColor: tokens.surface,
              borderWidth: 1,
              borderColor: tokens.border,
              borderRadius: clubRadius.lg,
              padding: 18,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: tokens.accentSoft,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <ProDayText style={{ ...APPLE_TYPOGRAPHY.caption1, color: tokens.accent, fontWeight: '700' }}>
                  SUR DEVIS
                </ProDayText>
              </View>
              <ProDayText style={{ ...APPLE_TYPOGRAPHY.subheadline, color: tokens.foreground, fontWeight: '700' }}>
                Dès 3 € / adhérent
              </ProDayText>
            </View>
            <ProDayText style={{ ...APPLE_TYPOGRAPHY.headline, color: tokens.foreground }}>
              Déploiement Intégral & Accompagnement Dédié
            </ProDayText>
            <ProDayText style={{ ...APPLE_TYPOGRAPHY.footnote, color: tokens.muted, lineHeight: 20 }}>
              • Importation complète des licences et effectifs Footclubs FFF en 24h{'\n'}
              • Configuration sur-mesure de la structure sportive et des créneaux terrains{'\n'}
              • Formation interactive du comité directeur et des éducateurs en visio{'\n'}
              • Support dédié et hotline prioritaire 7j/7 tout au long de la saison
            </ProDayText>
            <PressableSpring
              onPress={() => setShowQuoteRequest(true)}
              style={{
                backgroundColor: tokens.accent,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                marginTop: 4,
              }}
              scaleTo={0.97}
            >
              <ProDayText style={{ ...APPLE_TYPOGRAPHY.subheadline, color: '#000000', fontWeight: '700' }}>
                Demander un devis personnalisé
              </ProDayText>
            </PressableSpring>
          </View>
        </View>
      </ClubChapterScroll>

      <Modal
        visible={showQuoteRequest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuoteRequest(false)}
      >
        <ClubQuoteRequestScreen onBack={() => setShowQuoteRequest(false)} />
      </Modal>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    identityCard: {
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      padding: clubSpace.lg,
      marginBottom: 20,
      gap: 16,
      overflow: 'hidden',
    },
    identityTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    crestContainer: {
      width: 64,
      height: 64,
      borderRadius: 18,
      borderWidth: 1.5,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    crestImg: {
      width: '100%',
      height: '100%',
    },
    crestPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    crestText: {
      ...APPLE_TYPOGRAPHY.title1,
      fontWeight: '800',
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identityMeta: {
      flex: 1,
      gap: 3,
    },
    fffBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      marginBottom: 2,
    },
    fffBadgeText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
    },
    clubName: {
      ...APPLE_TYPOGRAPHY.title2,
    },
    clubSub: {
      ...APPLE_TYPOGRAPHY.footnote,
    },
    gouvernanceRow: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 14,
      borderTopWidth: 1,
    },
    govBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
    },
    govBtnText: {
      ...APPLE_TYPOGRAPHY.footnote,
      fontWeight: '600',
    },
    sectionHeader: {
      marginBottom: 12,
    },
    sectionTitle: {
      ...APPLE_TYPOGRAPHY.title3,
    },
    sectionSubtitle: {
      ...APPLE_TYPOGRAPHY.footnote,
      marginTop: 2,
    },
    structureGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    structureCard: {
      flex: 1,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    structureIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    structureNum: {
      ...APPLE_TYPOGRAPHY.title2,
      fontWeight: '800',
    },
    structureLabel: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
      textAlign: 'center',
    },
    structureSub: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontSize: 10,
      textAlign: 'center',
    },
    packCard: {
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      padding: 16,
      gap: 12,
      marginBottom: 24,
    },
    packTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    packBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    packBadgeText: {
      ...APPLE_TYPOGRAPHY.caption1,
      fontWeight: '700',
    },
    packPrice: {
      ...APPLE_TYPOGRAPHY.subheadline,
      fontWeight: '700',
    },
    packTitle: {
      ...APPLE_TYPOGRAPHY.headline,
    },
    packDesc: {
      ...APPLE_TYPOGRAPHY.footnote,
      lineHeight: 19,
    },
    quoteBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 4,
    },
    quoteBtnText: {
      ...APPLE_TYPOGRAPHY.subheadline,
      fontWeight: '700',
      color: '#000000',
    },
  });
