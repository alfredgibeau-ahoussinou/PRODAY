import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  PlayerTacticalPitchView,
  type TacticalPitchPlayer,
} from '../../components/player/PlayerTacticalPitchView';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../../components/player/PlayerPageGuideBanner';

export const PlayerTacticalView: React.FC = () => {
  const profile = useSessionProfile();
  const userName = profile?.display_name || 'Kylian Perez';

  const [selectedPlayer, setSelectedPlayer] = useState<TacticalPitchPlayer | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const guideSections: GuideSection[] = [
    {
      icon: 'football',
      iconColor: '#30D158',
      title: 'Dispositif Tactique & 11 de Départ',
      description: 'Découvre la formation choisie par le coach (ex. 4-3-3). Ton poste (ST N°9) est directement entouré d\'un halo vert vif et identifié comme titulaire.',
      badge: 'FORMATION',
    },
    {
      icon: 'clipboard',
      iconColor: '#FFD700',
      title: 'Consignes & Directives Staff',
      description: 'Prends connaissance des consignes collectives et individuelles : hauteur de bloc, zones de déclenchement du pressing et circuits de passe prioritaires.',
      badge: 'DIRECTIVES',
    },
    {
      icon: 'radio',
      iconColor: '#0A84FF',
      title: 'Causerie Vestiaire en Direct',
      description: 'Le tableau noir du coach et la causerie d\'avant-match sont diffusés en direct sur ton smartphone. Tu restes connecté même pendant tes étirements.',
      badge: 'LIVE LOCKER',
    },
    {
      icon: 'flag',
      iconColor: '#A855F7',
      title: 'Coups de Pied Arrêtés & Rôles',
      description: 'Consulte la hiérarchie officielle : tireur de corners, coups francs directs et penaltys. Les rôles défensifs au premier et deuxième poteau sont également listés.',
    },
  ];

  // 4-3-3 Official Starting XI Lineup
  const startingXI: TacticalPitchPlayer[] = [
    { id: 'p1', name: 'Hugo Lloris', number: 1, pos: 'GK', x: 50, y: 90, isUser: false },
    { id: 'p2', name: 'Théo Hernandez', number: 3, pos: 'LB', x: 18, y: 72, isUser: false },
    { id: 'p3', name: 'Raphaël Varane', number: 4, pos: 'CB', x: 38, y: 76, isUser: false },
    { id: 'p4', name: 'Dayot Upamecano', number: 5, pos: 'CB', x: 62, y: 76, isUser: false },
    { id: 'p5', name: 'Jules Koundé', number: 2, pos: 'RB', x: 82, y: 72, isUser: false },
    { id: 'p6', name: 'Aurélien Tchouaméni', number: 8, pos: 'CDM', x: 50, y: 55, isUser: false },
    { id: 'p7', name: 'Adrien Rabiot', number: 6, pos: 'CM', x: 30, y: 44, isUser: false },
    { id: 'p8', name: 'Antoine Griezmann', number: 7, pos: 'CAM', x: 70, y: 44, isUser: false },
    { id: 'p9', name: 'Ousmane Dembélé', number: 11, pos: 'RW', x: 82, y: 24, isUser: false },
    { id: 'p10', name: userName, number: 9, pos: 'ST', x: 50, y: 16, isUser: true }, // The user!
    { id: 'p11', name: 'Bradley Barcola', number: 10, pos: 'LW', x: 18, y: 24, isUser: false },
  ];

  const bench = [
    { id: 'b1', name: 'Mike Maignan', number: 16, pos: 'GK' },
    { id: 'b2', name: 'William Saliba', number: 17, pos: 'CB' },
    { id: 'b3', name: 'Eduardo Camavinga', number: 12, pos: 'CM' },
    { id: 'b4', name: 'Randal Kolo Muani', number: 19, pos: 'ST' },
    { id: 'b5', name: 'Marcus Thuram', number: 20, pos: 'ST' },
  ];

  const setPieceRoles = [
    { role: 'Tireur Corners Droits', assignedTo: 'Antoine Griezmann (N°7)', isUser: false },
    { role: 'Tireur Corners Gauches', assignedTo: 'Bradley Barcola (N°10)', isUser: false },
    { role: 'Coups Francs Directs', assignedTo: `${userName} (N°9)`, isUser: true },
    { role: 'Penaltys (Tireur N°1)', assignedTo: `${userName} (N°9)`, isUser: true },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenSubtitle}>Locker Room & Dispositif</Text>
          <Text style={styles.screenTitle}>Vestiaire Tactique</Text>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.guideIconBtn}
            onPress={() => {
              prodayHaptics.selection();
              setShowGuideModal(true);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Guide de la page"
          >
            <Ionicons name="help-circle-outline" size={16} color="#30D158" />
            <Text style={styles.guideBtnText}>Guide</Text>
          </TouchableOpacity>

          <View style={styles.starterBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#30D158" />
            <Text style={styles.starterBadgeText}>Titulaire (N°9)</Text>
          </View>
        </View>
      </View>

      {/* Dismissible Onboarding Guide Banner */}
      <PlayerPageGuideBanner
        pageKey="tactics"
        title="Guide Vestiaire & Dispositif Tactique"
        subtitle="Repère ton poste sur le terrain et suis la causerie du coach"
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* Sync Locker Causerie Live Banner */}
      <LinearGradient
        colors={['#1E1B4B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.causerieBanner}
      >
        <View style={styles.causerieIcon}>
          <MaterialCommunityIcons name="broadcast" size={22} color="#818CF8" />
        </View>
        <View style={styles.causerieTextCol}>
          <Text style={styles.causerieTitle}>Causerie Vestiaire Synchronisée</Text>
          <Text style={styles.causerieSub}>
            Diffusée en direct par le coach avant le coup d'envoi
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN DIRECT</Text>
        </View>
      </LinearGradient>

      {/* Interactive Tactical Pitch */}
      <PlayerTacticalPitchView
        formation="4-3-3 Offensif"
        players={startingXI}
        benchPlayers={bench}
        coachDirective="Bloc médian compact. Pressing déclenché à la passe en retrait adverse. Projection rapide en transition via les couloirs."
        onSelectPlayer={setSelectedPlayer}
      />

      {/* Set-Piece Roles & Responsibilities */}
      <View style={styles.setPiecesSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Coups de Pied Arrêtés</Text>
          <Text style={styles.sectionHeaderSub}>Attributions officielles du staff</Text>
        </View>

        <View style={styles.setPiecesCard}>
          {setPieceRoles.map((sp, idx) => (
            <View
              key={idx}
              style={[
                styles.setPieceRow,
                sp.isUser && styles.setPieceRowHighlight,
                idx === setPieceRoles.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.setPieceLeft}>
                <Ionicons
                  name={sp.isUser ? 'star' : 'football'}
                  size={16}
                  color={sp.isUser ? '#FFD700' : '#64748B'}
                />
                <Text style={[styles.setPieceRole, sp.isUser && styles.setPieceRoleHighlight]}>
                  {sp.role}
                </Text>
              </View>

              <Text style={[styles.setPiecePlayer, sp.isUser && styles.setPiecePlayerHighlight]}>
                {sp.assignedTo}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Interactive Page Guide Modal */}
      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Vestiaire & Dispositif Tactique"
        pageSubtitle="Composition d'équipe, terrain interactif et consignes du staff"
        badgeLabel="GUIDE TACTIQUE & LOCKER"
        badgeColor="#30D158"
        introText="Cet écran te donne une visibilité complète sur la feuille de match : ta position exacte sur le terrain, le dispositif du coach, la causerie vestiaire en direct et tes responsabilités sur coups de pied arrêtés."
        sections={guideSections}
        proTip="Touche n'importe quel joueur sur le terrain pour afficher son profil et comprendre son rôle d'animation dans le système du coach !"
        ctaLabel="Prêt pour le match !"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  guideBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  screenSubtitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    color: '#94A3B8',
  },
  screenTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  starterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  starterBadgeText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  causerieBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  causerieIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  causerieTextCol: {
    flex: 1,
  },
  causerieTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  causerieSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  setPiecesSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeaderSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  setPiecesCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  setPieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  setPieceRowHighlight: {
    backgroundColor: 'rgba(48, 209, 88, 0.06)',
  },
  setPieceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setPieceRole: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  setPieceRoleHighlight: {
    color: '#30D158',
    fontWeight: '800',
  },
  setPiecePlayer: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
  },
  setPiecePlayerHighlight: {
    color: '#30D158',
    fontWeight: '700',
  },
});
