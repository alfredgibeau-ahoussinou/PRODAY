import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { activeFffSeason } from '../../services/frenchFootballStandings.service';
import { ADMIN_TOKENS } from '../../features/admin/theme/adminTokens';

interface CotisationData {
  collectedEur: number;
  totalBudgetEur: number;
  paidMembers: number;
  pendingMembers: number;
  unpaidAmountEur: number;
}

interface PitchReservation {
  id: string;
  facility: string;
  timeSlot: string;
  team: string;
  status: 'occupied' | 'upcoming' | 'maintenance';
}

interface Announcement {
  id: string;
  title: string;
  category: 'officiel' | 'urgence' | 'ag';
  date: string;
  content: string;
}

export const AdminHomeScreen: React.FC = () => {
  /** Aucun montant inventé : les cotisations réelles seront branchées sur la
   * comptabilité club. En attendant, les compteurs restent à zéro et l'écran
   * l'indique explicitement. */
  const cotisations: CotisationData = {
    collectedEur: 0,
    totalBudgetEur: 0,
    paidMembers: 0,
    pendingMembers: 0,
    unpaidAmountEur: 0,
  };
  const cotisationsConnected = false;  /** Aucun créneau fictif : le planning réel des installations sera branché
   * sur les événements d'équipe géolocalisés. */
  const reservations: PitchReservation[] = [];

  /** Aucune annonce fictive : les communications du bureau passent par le
   * service d'annonces du club (clubAnnouncements). */
  const announcements: Announcement[] = [];

  const seasonLabel = activeFffSeason().replace('-', '/');
  const percentCollected =
    cotisations.totalBudgetEur > 0
      ? Math.round((cotisations.collectedEur / cotisations.totalBudgetEur) * 100)
      : 0;

  const handleSendReminder = () => {
    prodayHaptics.press();
    Alert.alert(
      'Relance indisponible',
      'Aucun SMS ni push n’est envoyé depuis cet écran : la relance des cotisations n’est pas encore connectée au service d’envoi.',
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Club Institutionnel */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>Direction du Club</Text>
            <Text style={styles.subtitle}>Cockpit Administratif · Saison {seasonLabel}</Text>
          </View>
          <View style={styles.avatarPill}>
            <Ionicons name="business" size={22} color="#0A84FF" />
          </View>
        </View>
      </View>

      {/* 2. Suivi Financier & Cotisations */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
            <Ionicons name="cash" size={20} color="#30D158" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Santé Financière & Cotisations</Text>
            <Text style={styles.cardSub}>Campagne d’adhésions en temps réel</Text>
          </View>
          <Text style={styles.highlightPercent}>{percentCollected}%</Text>
        </View>

        {!cotisationsConnected ? (
          <Text style={styles.honestNote}>
            Montants réels à connecter — aucun indicateur financier n’est inventé sur cet écran.
          </Text>
        ) : null}

        {/* Barre de progression élégante */}
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={['#0A84FF', '#30D158']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${percentCollected}%` }]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{cotisations.collectedEur.toLocaleString('fr-FR')} €</Text>
            <Text style={styles.statLabel}>Encaissés ({cotisations.paidMembers} lic.)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#FF9F0A' }]}>
              {cotisations.unpaidAmountEur.toLocaleString('fr-FR')} €
            </Text>
            <Text style={styles.statLabel}>Reste dû ({cotisations.pendingMembers} lic.)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSendReminder}
          activeOpacity={0.8}
        >
          <Ionicons name="paper-plane" size={16} color="#000000" />
          <Text style={styles.actionBtnText}>Relance des impayés (envoi non connecté)</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Homologation FFF & Conformité Juridique */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
            <Ionicons name="ribbon" size={20} color="#0A84FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Homologation & Conformité FFF</Text>
            <Text style={styles.cardSub}>Validité licences, certificats & assurances</Text>
          </View>
        </View>

        <Text style={styles.honestNote}>
          Le suivi des licences, certificats médicaux et assurances s’affichera ici une fois
          connecté aux données de la Ligue — aucun indicateur de conformité fictif n’est affiché.
        </Text>
      </View>

      {/* 4. Gestion des Installations & Terrains */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
            <Ionicons name="football" size={20} color="#FF9F0A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Planning Terrains & Installations</Text>
            <Text style={styles.cardSub}>Créneaux du complexe aujourd'hui</Text>
          </View>
        </View>

        <View style={styles.reservationList}>
          {reservations.length === 0 ? (
            <Text style={styles.honestNote}>
              Aucun créneau d’installation enregistré pour aujourd’hui.
            </Text>
          ) : reservations.map((item) => (
            <View key={item.id} style={styles.reservationRow}>
              <View style={styles.resIconCol}>
                <View
                  style={[
                    styles.resDot,
                    item.status === 'occupied' && { backgroundColor: '#30D158' },
                    item.status === 'upcoming' && { backgroundColor: '#0A84FF' },
                    item.status === 'maintenance' && { backgroundColor: '#FF453A' },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resFacility}>{item.facility}</Text>
                <Text style={styles.resTeam}>{item.team}</Text>
              </View>
              <View style={styles.resTimeBadge}>
                <Text style={styles.resTimeText}>{item.timeSlot}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Annonces Institutionnelles */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(192, 132, 252, 0.15)' }]}>
            <Ionicons name="megaphone" size={20} color="#C084FC" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Annonces Institutionnelles</Text>
            <Text style={styles.cardSub}>Communications officielles du bureau</Text>
          </View>
        </View>

        {announcements.length === 0 ? (
          <Text style={styles.honestNote}>
            Aucune annonce institutionnelle publiée. Les communications officielles du bureau
            apparaîtront ici dès leur publication.
          </Text>
        ) : announcements.map((ann) => (
          <View key={ann.id} style={styles.annItem}>
            <View style={styles.annTop}>
              <View style={styles.annTag}>
                <Text style={styles.annTagText}>{ann.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.annDate}>{ann.date}</Text>
            </View>
            <Text style={styles.annTitle}>{ann.title}</Text>
            <Text style={styles.annContent}>{ann.content}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  clubBadgeText: {
    color: '#30D158',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  avatarPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: ADMIN_TOKENS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  honestNote: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  highlightPercent: {
    color: '#30D158',
    fontSize: 22,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0B0B0E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnDone: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadgeGreen: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeGreenText: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '700',
  },
  complianceList: {
    gap: 10,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  complianceText: {
    color: '#CBD5E1',
    fontSize: 13,
    flex: 1,
  },
  reservationList: {
    gap: 12,
  },
  reservationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  resIconCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resFacility: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  resTeam: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  resTimeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resTimeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  annItem: {
    backgroundColor: '#0B0B0E',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  annTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  annTag: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  annTagText: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '700',
  },
  annDate: {
    color: '#64748B',
    fontSize: 11,
  },
  annTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  annContent: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
});
