import type { GeoPoint } from '../models/User';
import { agentsWithinRadius } from '../utils/geofencing';
import { usersService } from './users.service';

export const notificationService = {
  async notifyAgentsNearTournament(
    tournamentLocation: GeoPoint,
    tournamentName: string,
    radiusKm = 50
  ): Promise<number> {
    const agents = await usersService.listByRole('agent');
    const withLocation = agents
      .filter((a) => a.location)
      .map((a) => ({
        uid: a.uid,
        location: a.location!,
        fcm_token: a.fcm_token,
      }));
    const nearby = agentsWithinRadius(tournamentLocation, withLocation, radiusKm);

    for (const agent of nearby) {
      await this.sendPush(agent.uid, agent.fcm_token, {
        title: 'Nouveau tournoi à proximité',
        body: `${tournamentName} — moins de ${radiusKm} km de vous.`,
      });
    }
    return nearby.length;
  },

  async sendPush(
    uid: string,
    _fcmToken: string | undefined,
    payload: { title: string; body: string }
  ): Promise<void> {
    // [FIREBASE] messaging.send({ token: fcmToken, notification: payload });
    console.log(`[FCM → ${uid}] ${payload.title}: ${payload.body}`);
  },
};
