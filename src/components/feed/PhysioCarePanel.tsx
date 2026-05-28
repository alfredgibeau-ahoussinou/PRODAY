import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import type { User } from '../../models/User';
import { usersService } from '../../services/users.service';
import { openContactConversation } from '../../utils/openContactConversation';
import { colors, spacing, radius } from '../../theme/designTokens';
import { Icon } from '../ui/Icon';

interface PhysioCarePanelProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

export const PhysioCarePanel: React.FC<PhysioCarePanelProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
}) => {
  const [physios, setPhysios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPhysios(await usersService.listPhysios(search));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const isPlayer = profile.role === 'player';
  const isPhysio = profile.role === 'physio';

  if (!isPlayer && !isPhysio) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>SUIVI SANTÉ</Text>
      <Text style={styles.title}>
        {isPlayer ? 'Contacter un kiné' : 'Joueurs — suivi blessure'}
      </Text>
      <Text style={styles.sub}>
        {isPlayer
          ? 'Messagerie dédiée joueur ↔ kinésithérapeute ProDay.'
          : 'Les joueurs vous contactent pour prévention et récupération.'}
      </Text>

      {isPlayer ? (
        <>
          <TextInput
            style={styles.search}
            placeholder="Ville, nom…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : physios.length === 0 ? (
            <Text style={styles.empty}>Aucun kiné inscrit pour le moment.</Text>
          ) : (
            physios.slice(0, 8).map((p) => (
              <TouchableOpacity
                key={p.uid}
                style={styles.row}
                onPress={() =>
                  void openContactConversation(profile, p, p.display_name, onOpenChat)
                }
              >
                <View style={styles.avatar}>
                  <Icon name="heart" size={18} color={colors.accent} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{p.display_name}</Text>
                  <Text style={styles.meta}>{p.city ?? 'Kinésithérapeute ProDay'}</Text>
                </View>
                <Icon name="chat" size={20} color={colors.accent} />
              </TouchableOpacity>
            ))
          )}
        </>
      ) : (
        <TouchableOpacity
          style={styles.inboxBtn}
          onPress={onOpenMessages}
        >
          <Text style={styles.inboxBtnText}>Voir ma messagerie</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
    backgroundColor: colors.background,
  },
  loader: { marginVertical: spacing.md },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  inboxBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  inboxBtnText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
});
