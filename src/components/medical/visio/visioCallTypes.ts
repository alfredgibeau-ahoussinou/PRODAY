export type VisioChatMessage = {
  id: string;
  from: string;
  text: string;
  at: number;
  local: boolean;
};

export type DailyVisioCallProps = {
  roomUrl: string;
  token?: string | null;
  userName: string;
  userId: string;
  joinUrl?: string;
  onLeft: () => void;
  onFatalError?: (message: string) => void;
};

export type VisioCallControlsProps = {
  camOn: boolean;
  micOn: boolean;
  screenSharing: boolean;
  chatOpen: boolean;
  screenShareSupported: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onHangUp: () => void;
};
