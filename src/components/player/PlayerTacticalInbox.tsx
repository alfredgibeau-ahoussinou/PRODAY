import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { tacticalShareService } from '../../services/matchTalk.service';
import type { TacticalSharePayload } from '../../models/TacticalShare';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';

/** Boîte de réception consignes tactiques (joueur). */
export const PlayerTacticalInbox: React.FC<{ uid: string }> = ({ uid }) => {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<TacticalSharePayload[]>([]);

  useEffect(() => {
    void tacticalShareService.listForPlayer(uid).then(setItems);
  }, [uid]);

  if (items.length === 0) {
    return (
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          Consignes tactiques
        </ProDayText>
        <ProDayText variant="caption" muted>
          Aucune consigne pour l’instant. Dès que ton coach partage un plan, il apparaît ici.
        </ProDayText>
      </ProDaySurface>
    );
  }

  return (
    <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
      <ProDayText variant="caption" accent style={styles.section}>
        Consignes tactiques
      </ProDayText>
      {items.slice(0, 5).map((item) => (
        <View key={item.id} style={styles.row}>
          <ProDayText variant="caption" style={{ fontWeight: '700' }}>
            {item.title}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {item.phase_label ? `${item.phase_label} · ` : ''}
            {item.note ?? 'Voir le détail'}
          </ProDayText>
        </View>
      ))}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  section: { fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
  row: { gap: 2, paddingVertical: 4 },
});
