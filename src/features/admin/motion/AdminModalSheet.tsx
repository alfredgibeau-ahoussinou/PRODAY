import React from 'react';
import { ModalSheet, type ModalSheetProps } from '../../../motion';
import { useAdminTokens } from '../theme/adminTokens';

type Props = Omit<
  ModalSheetProps,
  'backgroundColor' | 'borderColor' | 'handleColor' | 'backdropColor'
> & {
  /** Conservé pour API Admin existante. */
  contentStyle?: ModalSheetProps['contentStyle'];
};

/**
 * Modal / bottom-sheet admin — chrome Liquid Glass Apple + motion global.
 */
export function AdminModalSheet(props: Props) {
  const t = useAdminTokens();
  return (
    <ModalSheet
      {...props}
      backgroundColor={t.surfaceRaised}
      borderColor={t.borderStrong}
      handleColor={t.borderLuxury}
      contentStyle={[
        props.contentStyle,
        (t.glassBackdrop as any),
      ]}
    />
  );
}
