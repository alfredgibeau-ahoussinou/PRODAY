import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const HELP_SECTIONS = [
  {
    icon: 'football',
    title: 'Poser du matériel & des plots',
    text: 'Sélectionnez "Plots & Matériel", choisissez votre équipement (Cône, Coupelle, Ballon, Haie, etc.) puis touchez simplement le terrain. Vous pouvez tapoter plusieurs fois d’affilée pour poser une ligne ou un carré de plots en quelques secondes.',
  },
  {
    icon: 'people',
    title: 'Placer des joueurs & gardiens',
    text: 'Sélectionnez "Joueurs", choisissez l’équipe (Bleus, Rouges, Joker, Gardien) et le numéro. Touchez le terrain pour placer le joueur. Pour donner la balle à un joueur, sélectionnez-le et activez le bouton "Balle".',
  },
  {
    icon: 'trending-up',
    title: 'Tracer des courses, passes et dribbles',
    text: 'Activez "Tracés", puis choisissez le type (Course en vert, Passe en bleu cyan, Conduite en ambre). Touchez le point de départ puis touchez la destination. La trajectoire est automatiquement liée pour l’animation.',
  },
  {
    icon: 'layers',
    title: 'Créer des séquences animées (Frames / Phases)',
    text: 'Chaque atelier peut comporter plusieurs phases chronologiques. Cliquez sur "+ Nouvelle phase" dans la timeline en bas : les positions de la phase précédente sont conservées et vous pouvez déplacer vos joueurs vers leurs nouvelles positions.',
  },
  {
    icon: 'play',
    title: 'Lecture & Contrôle de l’animation',
    text: 'Appuyez sur ▶ Play pour lancer l’animation fluide en boucle. Vous pouvez régler la vitesse (0.5x, 1x, 2x), faire défiler la barre de progression ou avancer image par image.',
  },
  {
    icon: 'eye',
    title: 'Vue 2D & Vue 3D Perspective',
    text: 'Basculez entre la vue 2D aérienne classique et la vue 3D en perspective. En 3D, choisissez votre angle de caméra (Haut, Face, Côté, Isométrique). Les coordonnées tactiques sont conservées à l’identique.',
  },
  {
    icon: 'save',
    title: 'Sauvegarde & Mode Hors-ligne',
    text: 'Vos modifications sont enregistrées automatiquement en continu (Autosave). Vous pouvez quitter l’écran et revenir sans jamais perdre votre travail.',
  },
];

export const CoachWorkspaceHelpModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.helpIconWrap}>
                <Ionicons name="help" size={16} color="#38BDF8" />
              </View>
              <Text style={styles.headerTitle}>Guide du Studio Tactique</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {HELP_SECTIONS.map((sec, idx) => (
              <View key={`help-${idx}`} style={styles.sectionItem}>
                <View style={styles.secIconCol}>
                  <Ionicons name={sec.icon as any} size={18} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.secTitle}>{sec.title}</Text>
                  <Text style={styles.secText}>{sec.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.85}>
            <Text style={styles.closeBtnText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scroll: {
    paddingVertical: 12,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  secIconCol: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 3,
  },
  secText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
  },
  closeBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
});
