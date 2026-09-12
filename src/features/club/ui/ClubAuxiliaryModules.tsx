/**
 * Pôle Club — Modules Complémentaires
 * Sponsoring, Buvette/Bénévolat, Protocole Commotion FFF & Équipements.
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

export type AuxiliaryModuleTab = 'sponsoring' | 'buvette' | 'medical' | 'equipment';

export function ClubAuxiliaryModules({
  initialTab = 'sponsoring',
}: {
  initialTab?: AuxiliaryModuleTab;
}) {
  const { tokens } = useClubTheme();
  const [activeTab, setActiveTab] = useState<AuxiliaryModuleTab>(initialTab);

  return (
    <View style={styles.container}>
      {/* 1. Barrette d'onglets de navigation entre les 4 modules */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {(
          [
            { id: 'sponsoring', label: 'Sponsoring & Partenaires', icon: 'gift' as IconName },
            { id: 'buvette', label: 'Buvette & Bénévoles', icon: 'time' as IconName },
            { id: 'medical', label: 'Médical & Commotion FFF', icon: 'fitness' as IconName },
            { id: 'equipment', label: 'Équipement & Dotations', icon: 'shirt' as IconName },
          ] as { id: AuxiliaryModuleTab; label: string; icon: IconName }[]
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <PressableSpring
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabPill,
                active
                  ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                  : { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
              scaleTo={0.96}
            >
              <Icon
                name={tab.icon}
                size={14}
                color={active ? '#000000' : tokens.muted}
              />
              <ProDayText
                style={[
                  styles.tabPillText,
                  active ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                ]}
              >
                {tab.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      {/* MODULE 1 : SPONSORING & PARTENAIRES */}
      {activeTab === 'sponsoring' ? (
        <View style={styles.tabContent}>
          <View style={[styles.kpiCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.kpiCol}>
              <ProDayText style={[styles.kpiVal, { color: tokens.accent }]}>
                18 500 €
              </ProDayText>
              <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
                Budget partenaires collecté
              </ProDayText>
            </View>
            <View style={[styles.kpiSep, { backgroundColor: tokens.border }]} />
            <View style={styles.kpiCol}>
              <ProDayText style={[styles.kpiVal, { color: '#10B981' }]}>
                8 Sponsors
              </ProDayText>
              <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
                Contrats actifs
              </ProDayText>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
              Partenaires Officiels Saison 2026-2027
            </ProDayText>

            {[
              { name: 'Garage Auto 92', type: 'Sponsor Majeur (Maillot Seniors)', amount: '6 000 €', status: 'Actif' },
              { name: 'Boulangerie du Stade', type: 'Fournisseur Goûters École de Foot', amount: '2 500 € (Dons)', status: 'Actif' },
              { name: 'Intersport Nanterre', type: 'Équipementier Packs Licences', amount: '10 000 € (Dotation)', status: 'Actif' },
            ].map((sp, idx) => (
              <View key={idx} style={[styles.itemRow, { borderTopColor: tokens.border }]}>
                <View>
                  <ProDayText style={[styles.itemTitle, { color: tokens.foreground }]}>{sp.name}</ProDayText>
                  <ProDayText style={[styles.itemSubtitle, { color: tokens.muted }]}>{sp.type}</ProDayText>
                </View>
                <View style={[styles.badge, { backgroundColor: tokens.accentSoft }]}>
                  <ProDayText style={[styles.badgeText, { color: tokens.accent }]}>{sp.amount}</ProDayText>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* MODULE 2 : BUVETTE & BÉNÉVOLAT */}
      {activeTab === 'buvette' ? (
        <View style={styles.tabContent}>
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
              Permanences Buvette (Week-end de Match)
            </ProDayText>

            {[
              { slot: 'Samedi 13:30 - 16:30', team: 'Plateau U11 & Match U13', assigned: 'Clémentine B. & Paul D.' },
              { slot: 'Samedi 17:30 - 20:30', team: 'Match Phare Seniors R1', assigned: 'Julien M. (1 place libre)' },
              { slot: 'Dimanche 09:30 - 12:30', team: 'Tournoi Matinal', assigned: 'Bénévoles à pourvoir' },
            ].map((p, idx) => (
              <View key={idx} style={[styles.itemRow, { borderTopColor: tokens.border }]}>
                <View style={{ flex: 1 }}>
                  <ProDayText style={[styles.itemTitle, { color: tokens.foreground }]}>{p.slot}</ProDayText>
                  <ProDayText style={[styles.itemSubtitle, { color: tokens.muted }]}>
                    {p.team} · {p.assigned}
                  </ProDayText>
                </View>
                <PressableSpring
                  onPress={() => Alert.alert('Inscription permanente', 'Votre inscription a été enregistrée. Merci pour votre engagement bénévole !')}
                  style={[styles.smallBtn, { backgroundColor: tokens.accent }]}
                  scaleTo={0.96}
                >
                  <ProDayText style={styles.smallBtnText}>Participer</ProDayText>
                </PressableSpring>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* MODULE 3 : MÉDICAL & PROTOCOLE COMMOTION FFF */}
      {activeTab === 'medical' ? (
        <View style={styles.tabContent}>
          <View style={[styles.alertBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
            <Icon name="fitness" size={20} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <ProDayText style={[styles.alertTitle, { color: '#EF4444' }]}>
                Protocole Commotion Cérébrale FFF
              </ProDayText>
              <ProDayText style={[styles.alertDesc, { color: tokens.muted }]}>
                Tout choc à la tête avec suspicion de commotion impose la sortie immédiate et définitive du joueur, un repos strict de 48h et un certificat de non contre-indication délivré par un médecin du sport.
              </ProDayText>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
              Registre Médical & Suivi des Blessures
            </ProDayText>

            {[
              { player: 'Enzo Vallet (Seniors R1)', injury: 'Élongation ischio-jambiers gauche', date: '06/09/2026', status: 'Soins en cours · Reprise le 20/09' },
              { player: 'Noah V. (U17 R2)', injury: 'Suspicion commotion (Choc tête)', date: '30/08/2026', status: 'Protocole FFF validé · Reprise autorisée' },
            ].map((med, idx) => (
              <View key={idx} style={[styles.itemRow, { borderTopColor: tokens.border }]}>
                <View>
                  <ProDayText style={[styles.itemTitle, { color: tokens.foreground }]}>{med.player}</ProDayText>
                  <ProDayText style={[styles.itemSubtitle, { color: '#EF4444' }]}>{med.injury}</ProDayText>
                  <ProDayText style={[styles.itemSubtitle, { color: tokens.muted, marginTop: 2 }]}>
                    {med.status}
                  </ProDayText>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* MODULE 4 : ÉQUIPEMENT & BOUTIQUE CLUB */}
      {activeTab === 'equipment' ? (
        <View style={styles.tabContent}>
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>
              Dotations Packs Licences & Stocks
            </ProDayText>

            {[
              { item: 'Packs Licences U15-U17 (Survêtement + Maillot + Short)', distributed: '64 / 68 remis', stock: '4 restants' },
              { item: 'Packs École de Foot U7-U11', distributed: '112 / 120 remis', stock: '8 restants' },
              { item: 'Ballons Match T5 Homologués FFF', distributed: '18 en service', stock: '12 neufs en réserve' },
              { item: 'Pharmacies & Trousses de premiers secours', distributed: '8 trousses équipées', stock: 'Réapprovisionné' },
            ].map((eq, idx) => (
              <View key={idx} style={[styles.itemRow, { borderTopColor: tokens.border }]}>
                <View style={{ flex: 1 }}>
                  <ProDayText style={[styles.itemTitle, { color: tokens.foreground }]}>{eq.item}</ProDayText>
                  <ProDayText style={[styles.itemSubtitle, { color: tokens.muted }]}>
                    {eq.distributed} · Stock : {eq.stock}
                  </ProDayText>
                </View>
                <View style={[styles.badge, { backgroundColor: tokens.accentSoft }]}>
                  <Icon name="checkmark-circle" size={14} color={tokens.accent} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  tabRow: {
    gap: 8,
    paddingBottom: 4,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    ...APPLE_TYPOGRAPHY.footnote,
  },
  tabContent: {
    gap: 14,
    paddingBottom: 40,
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    ...APPLE_TYPOGRAPHY.title2,
    fontSize: 20,
    lineHeight: 24,
  },
  kpiLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
    textAlign: 'center',
  },
  kpiSep: {
    width: 1,
    height: 28,
  },
  card: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  itemTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '600',
  },
  itemSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#000000',
  },
  alertBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
  },
  alertTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  alertDesc: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 4,
    lineHeight: 18,
  },
});
