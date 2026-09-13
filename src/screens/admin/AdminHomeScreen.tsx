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
  const [cotisations] = useState<CotisationData>({
    collectedEur: 48650,
    totalBudgetEur: 58000,
    paidMembers: 312,
    pendingMembers: 48,
    unpaidAmountEur: 9350,
  });

  const [reminded, setReminded] = useState(false);

  const [reservations] = useState<PitchReservation[]>([
    {
      id: 'r1',
      facility: 'Terrain Honneur (Pelouse)',
      timeSlot: '18h30 - 20h30',
      team: 'Seniors R1 (Séance Tactique)',
      status: 'occupied',
    },
    {
      id: 'r2',
      facility: 'Terrain Synthétique A',
      timeSlot: '17h00 - 18h30',
      team: 'U17 & U19 Nationaux',
      status: 'upcoming',
    },
    {
      id: 'r3',
      facility: 'Gymnase / Futsal',
      timeSlot: '18h00 - 19h30',
      team: 'École de Foot U11',
      status: 'upcoming',
    },
    {
      id: 'r4',
      facility: 'Vestiaires 1 & 2',
      timeSlot: '21h00 - 22h00',
      team: 'Désinfection & Entretien',
      status: 'maintenance',
    },
  ]);

  const [announcements] = useState<Announcement[]>([
    {
      id: 'a1',
      title: 'Assemblée Générale Ordinaire 2026',
      category: 'ag',
      date: '28 Oct 2026',
      content: 'Présentation des bilans financiers et approbation du projet éducatif au Club House.',
    },
    {
      id: 'a2',
      title: 'Directives Arbitrage & Éthique FFF',
      category: 'officiel',
      date: '10 Sept 2026',
      content: 'Rappel des protocoles officiels de contestation et sanctions disciplinaires de poule.',
    },
  ]);

  const percentCollected = Math.round((cotisations.collectedEur / cotisations.totalBudgetEur) * 100);

  const handleSendReminder = () => {
    prodayHaptics.confirm();
    setReminded(true);
    Alert.alert(
      'Relance Envoyée',
      `Un SMS et une notification Push de rappel ont été envoyés aux ${cotisations.pendingMembers} adhérents en attente de cotisation.`,
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
            <View style={styles.clubBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#30D158" />
              <Text style={styles.clubBadgeText}>FFF N°500123 · DISTRIC PRODAY</Text>
            </View>
            <Text style={styles.title}>Direction du Club</Text>
            <Text style={styles.subtitle}>Cockpit Administratif · Saison 2025/2026</Text>
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
          style={[styles.actionBtn, reminded && styles.actionBtnDone]}
          onPress={handleSendReminder}
          activeOpacity={0.8}
        >
          <Ionicons
            name={reminded ? 'checkmark-circle' : 'paper-plane'}
            size={16}
            color={reminded ? '#30D158' : '#000000'}
          />
          <Text style={[styles.actionBtnText, reminded && { color: '#30D158' }]}>
            {reminded ? 'Relance effectuée aujourd’hui' : 'Relancer les 48 impayés en 1 tap'}
          </Text>
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
          <View style={styles.statusBadgeGreen}>
            <Text style={styles.statusBadgeGreenText}>Conforme</Text>
          </View>
        </View>

        <View style={styles.complianceList}>
          <View style={styles.complianceItem}>
            <Ionicons name="checkmark-circle" size={18} color="#30D158" />
            <Text style={styles.complianceText}>
              <Text style={{ fontWeight: '700', color: '#FFF' }}>348 / 360 </Text>
              Licences validées par la Ligue FFF
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons name="alert-circle" size={18} color="#FFD60A" />
            <Text style={styles.complianceText}>
              <Text style={{ fontWeight: '700', color: '#FFF' }}>7 </Text>
              Certificats médicaux en attente de visa médecin
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons name="shield-checkmark" size={18} color="#30D158" />
            <Text style={styles.complianceText}>Assurance Responsabilité Civile Club à jour (2026)</Text>
          </View>
        </View>
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
          {reservations.map((item) => (
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

        {announcements.map((ann) => (
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
    backgroundColor: '#141418',
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
