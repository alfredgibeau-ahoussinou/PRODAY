/**
 * Consigne individuelle — envoie un clip annoté à un joueur via messaging.
 * Réutilise message_threads + tactical_shares.
 */

import { messagesService } from './messages.service';
import { tacticalShareService } from './matchTalk.service';
import type { VideoClip } from '../models/VideoClip';

export interface ClipInstructionInput {
  clip: VideoClip;
  videoTitle: string;
  coachUid: string;
  coachName: string;
  playerUid: string;
  playerName: string;
  instruction: string;
  clubId?: string;
  eventId?: string;
}

function buildInstructionBody(input: ClipInstructionInput): string {
  const range = `${Math.floor(input.clip.start_sec / 60)}:${String(input.clip.start_sec % 60).padStart(2, '0')} → ${Math.floor(input.clip.end_sec / 60)}:${String(input.clip.end_sec % 60).padStart(2, '0')}`;
  return [
    `Consigne vidéo · ${input.videoTitle}`,
    `Clip : ${range}`,
    `\n${input.instruction}`,
    `\n[clip:${input.clip.id}|video:${input.clip.video_id}]`,
  ].join('\n');
}

export const clipInstructionService = {
  /**
   * Envoie une consigne individuelle : crée un message + un tactical_share.
   */
  async send(input: ClipInstructionInput): Promise<{ threadId: string; shareId: string }> {
    const threadId = await messagesService.getOrCreateThread(
      input.coachUid,
      input.coachName,
      input.playerUid,
      input.playerName,
      { currentRole: 'coach', otherRole: 'player' },
    );

    const body = buildInstructionBody(input);
    await messagesService.sendMessage(
      threadId,
      input.coachUid,
      input.playerUid,
      body,
    );

    const share = await tacticalShareService.publish({
      board_event_id: input.eventId,
      club_id: input.clubId,
      author_uid: input.coachUid,
      title: `Consigne clip · ${input.videoTitle}`,
      phase_label: input.clip.tag,
      note: input.instruction,
      audience: 'player',
      recipient_uids: [input.playerUid],
    });

    return { threadId, shareId: share.id };
  },

  /** Parse un deep-link clip depuis le body d'un message. */
  parseClipRef(body: string): { clipId: string; videoId: string } | null {
    const match = body.match(/\[clip:([^\]|]+)\|video:([^\]]+)\]/);
    if (!match) return null;
    return { clipId: match[1], videoId: match[2] };
  },
};
