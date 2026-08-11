import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AdminHqRail } from './hq/AdminHqRail';
import type { AdminHqModeId } from '../../navigation/adminTabConfig';
import { adminChrome } from '../../theme/adminTheme';

interface AdminDrawerMenuProps {
  visible: boolean;
  activeMode: AdminHqModeId;
  queueCount: number;
  onClose: () => void;
  onNavigate: (mode: AdminHqModeId) => void;
  onSearch: () => void;
}

/** Mobile rail drawer for HQ. */
export const AdminDrawerMenu: React.FC<AdminDrawerMenuProps> = ({
  visible,
  activeMode,
  queueCount,
  onClose,
  onNavigate,
  onSearch,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.panel}>
          <AdminHqRail
            activeMode={activeMode}
            queueCount={queueCount}
            onSelect={(mode) => {
              onNavigate(mode);
              onClose();
            }}
            onSearch={() => {
              onSearch();
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    height: '100%',
    zIndex: 2,
    backgroundColor: adminChrome.rail,
  },
});
