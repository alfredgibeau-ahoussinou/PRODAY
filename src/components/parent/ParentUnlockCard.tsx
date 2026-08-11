import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ParentActionButton, ParentSectionCard } from './parentPortalUi';
import { parentalGuardianService } from '../../services/parentalGuardian.service';
import { spacing } from '../../theme/designTokens';
import type { ParentChildBundle } from '../../services/parentPortal.service';

type Props = {
  child: ParentChildBundle;
  guardianEmail: string;
  onDone: () => Promise<void> | void;
};

/** File d’attente déblocage temps d’écran — Accorder / Refuser. */
export const ParentUnlockCard: React.FC<Props> = ({ child, guardianEmail, onDone }) => {
  const pending = child.settings.unlock_request?.status === 'pending';
  const minutes = child.settings.unlock_request?.minutes ?? 15;
  const [busy, setBusy] = useState<'approve' | 'deny' | null>(null);

  if (!pending) return null;

  const run = async (kind: 'approve' | 'deny') => {
    setBusy(kind);
    try {
      if (kind === 'approve') {
        await parentalGuardianService.approveUnlock(child.uid, guardianEmail);
        Alert.alert('Temps accordé', `+${minutes} min pour ${child.display_name} aujourd’hui.`);
      } else {
        await parentalGuardianService.denyUnlock(child.uid, guardianEmail);
        Alert.alert('Demande refusée', `${child.display_name} reste sur la limite actuelle.`);
      }
      await onDone();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ParentSectionCard
      title="Demande de temps d’écran"
      subtitle={`${child.display_name} demande +${minutes} min`}
    >
      <ProDayText variant="caption" muted>
        Validez ou refusez — l’enfant est notifié immédiatement.
      </ProDayText>
      <View style={styles.row}>
        <ParentActionButton
          label="Accorder"
          icon="checkmark-circle"
          onPress={() => void run('approve')}
          loading={busy === 'approve'}
          disabled={busy != null}
        />
        <ParentActionButton
          label="Refuser"
          tone="ghost"
          icon="close"
          onPress={() => void run('deny')}
          loading={busy === 'deny'}
          disabled={busy != null}
        />
      </View>
    </ParentSectionCard>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
