import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  DrawingObject,
  EquipmentToken,
  EquipmentType,
  PlayerToken,
  TacticalZone,
  TeamSide,
} from './trainingWorkspaceModel';
import { EQUIPMENT_PRESET_COLORS, TEAM_PRESET_COLORS } from './trainingWorkspaceModel';

interface Props {
  selectedPlayer?: PlayerToken | null;
  selectedEquipment?: EquipmentToken | null;
  selectedDrawing?: DrawingObject | null;
  selectedZone?: TacticalZone | null;
  onUpdatePlayer: (patch: Partial<PlayerToken>) => void;
  onUpdateEquipment: (patch: Partial<EquipmentToken>) => void;
  onUpdateDrawing: (patch: Partial<DrawingObject>) => void;
  onUpdateZone: (patch: Partial<TacticalZone>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onNudge: (dx: number, dy: number) => void;
  onClose: () => void;
}

export const CoachContextualInspector: React.FC<Props> = ({
  selectedPlayer,
  selectedEquipment,
  selectedDrawing,
  selectedZone,
  onUpdatePlayer,
  onUpdateEquipment,
  onUpdateDrawing,
  onUpdateZone,
  onDuplicate,
  onDelete,
  onRotate,
  onNudge,
  onClose,
}) => {
  if (!selectedPlayer && !selectedEquipment && !selectedDrawing && !selectedZone) {
    return null;
  }

  return (
    <View style={styles.card}>
      {/* En-tête de l'inspecteur */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={
              selectedPlayer
                ? 'person'
                : selectedEquipment
                  ? 'football'
                  : selectedDrawing
                    ? 'trending-up'
                    : 'crop'
            }
            size={14}
            color="#38BDF8"
          />
          <Text style={styles.headerTitle}>
            {selectedPlayer
              ? `Joueur #${selectedPlayer.num ?? ''} (${TEAM_PRESET_COLORS[selectedPlayer.team]?.label || 'Bleus'})`
              : selectedEquipment
                ? `Équipement · ${selectedEquipment.type}`
                : selectedDrawing
                  ? `Tracé · ${selectedDrawing.type}`
                  : 'Zone tactique'}
          </Text>
        </View>

        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Propriétés Joueur */}
      {selectedPlayer && (
        <View style={styles.propsRow}>
          {/* Équipe / Maillot */}
          <View style={styles.teamGroup}>
            {(['teamA', 'teamB', 'neutral', 'gk', 'coach'] as TeamSide[]).map((team) => {
              const active = selectedPlayer.team === team;
              return (
                <TouchableOpacity
                  key={team}
                  onPress={() => onUpdatePlayer({ team })}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: TEAM_PRESET_COLORS[team]?.fill },
                    active && styles.colorCircleActive,
                  ]}
                />
              );
            })}
          </View>

          {/* Numéro de maillot */}
          <TextInput
            style={styles.numberInput}
            value={selectedPlayer.num != null ? String(selectedPlayer.num) : ''}
            onChangeText={(txt) => {
              const n = parseInt(txt, 10);
              onUpdatePlayer({ num: Number.isFinite(n) ? n : undefined });
            }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="N°"
            placeholderTextColor="#64748B"
          />

          {/* Nom / Initiales */}
          <TextInput
            style={styles.labelInput}
            value={selectedPlayer.label || ''}
            onChangeText={(label) => onUpdatePlayer({ label })}
            placeholder="Nom/Poste"
            placeholderTextColor="#64748B"
          />

          {/* Porteur de balle */}
          <TouchableOpacity
            onPress={() => onUpdatePlayer({ hasBall: !selectedPlayer.hasBall })}
            style={[styles.ballCarrierBtn, selectedPlayer.hasBall && styles.ballCarrierBtnActive]}
          >
            <Ionicons name="football" size={13} color={selectedPlayer.hasBall ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.ballCarrierText, selectedPlayer.hasBall && styles.ballCarrierTextActive]}>
              Balle
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Propriétés Équipement */}
      {selectedEquipment && (
        <View style={styles.propsRow}>
          {/* Palette de couleur des plots */}
          <View style={styles.teamGroup}>
            {['#F97316', '#FACC15', '#EF4444', '#FFFFFF', '#3B82F6'].map((col) => (
              <TouchableOpacity
                key={col}
                onPress={() => onUpdateEquipment({ color: col })}
                style={[
                  styles.colorCircle,
                  { backgroundColor: col },
                  selectedEquipment.color === col && styles.colorCircleActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Barre d'action contextuelle (Nudge, Dupliquer, Tourner, Supprimer) */}
      <View style={styles.actionsBar}>
        {/* Nudge précis */}
        <View style={styles.nudgeRow}>
          <TouchableOpacity onPress={() => onNudge(-2, 0)} style={styles.nudgeBtn}>
            <Ionicons name="caret-back" size={14} color="#E2E8F0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNudge(0, -2)} style={styles.nudgeBtn}>
            <Ionicons name="caret-up" size={14} color="#E2E8F0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNudge(0, 2)} style={styles.nudgeBtn}>
            <Ionicons name="caret-down" size={14} color="#E2E8F0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNudge(2, 0)} style={styles.nudgeBtn}>
            <Ionicons name="caret-forward" size={14} color="#E2E8F0" />
          </TouchableOpacity>
        </View>

        <View style={styles.toolActionsGroup}>
          <TouchableOpacity onPress={onRotate} style={styles.actionBtn}>
            <MaterialCommunityIcons name="rotate-right" size={14} color="#38BDF8" />
            <Text style={styles.actionBtnText}>Pivoter</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDuplicate} style={styles.actionBtn}>
            <Feather name="copy" size={13} color="#38BDF8" />
            <Text style={styles.actionBtnText}>Dupliquer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, styles.deleteBtn]}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  propsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teamGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  numberInput: {
    width: 36,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
  },
  labelInput: {
    flex: 1,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: '600',
  },
  ballCarrierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  ballCarrierBtnActive: {
    backgroundColor: '#15803D',
    borderColor: '#22C55E',
  },
  ballCarrierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  ballCarrierTextActive: {
    color: '#FFFFFF',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nudgeBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
