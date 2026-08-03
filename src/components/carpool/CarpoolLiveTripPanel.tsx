import React from 'react';
import type { CarpoolPassenger } from '../../models/TeamEvent';
import type { CarpoolTripStatus } from '../../models/CarpoolLiveTrip';
import type { GeoPoint } from '../../models/User';
import { CarpoolLiveMission } from './CarpoolLiveMission';

interface CarpoolLiveTripPanelProps {
  tripId: string;
  viewerUid: string;
  driverUid: string;
  driverName: string;
  passengers: CarpoolPassenger[] | undefined;
  tripStatus: CarpoolTripStatus;
  title?: string;
  meetingPlace?: string;
  meetingLocation?: GeoPoint;
  destinationLabel?: string;
  destinationLocation?: GeoPoint;
  onStartTrip: () => Promise<void>;
  onEndTrip: () => Promise<void>;
  onTripChanged?: () => void;
  onContactDriver?: () => void;
}

/** Wrapper → centre de mission live. */
export const CarpoolLiveTripPanel: React.FC<CarpoolLiveTripPanelProps> = (props) => {
  return <CarpoolLiveMission {...props} compact />;
};
