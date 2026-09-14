import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../models/User';

interface PublicProfileModalProps {
  user: User;
  onClose: () => void;
  onOpenMessage: (user: User) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  user,
  onClose,
  onOpenMessage,
}) => {
  const displayName = user.display_name || 'Utilisateur';
  const roleLabel =
    user.role === 'player'
      ? 'Joueur'
      : user.role === 'coach'
        ? 'Coach'
        : user.role === 'club'
          ? 'Dirigeant Club'
          : 'Membre ProDay';
  const clubName = user.profile?.club_id || 'Club non renseigné';
  const position = user.profile?.position;

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.name}>{displayName}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                </View>
                {position ? (
                  <View style={styles.posBadge}>
                    <Text style={styles.posBadgeText}>{position}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.clubText}>{clubName}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => onOpenMessage(user)}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#000000" />
              <Text style={styles.messageBtnText}>Envoyer un message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#00F59B',
    fontSize: 20,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  posBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  posBadgeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  clubText: {
    fontSize: 13,
    color: '#64748B',
  },
  actionsContainer: {
    marginTop: 10,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F59B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  messageBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
