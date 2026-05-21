import type { GeoPoint } from '../models/User';
import { agentsWithinRadius } from '../utils/geofencing';

export const notificationService = {
  async notifyAgentsNearTournament(
    tournamentLocation: GeoPoint,
    tournamentName: string,
    radiusKm = 50
  ): Promise<number> {
    // [FIREBASE] const agents = await db.collection('users').where('role', '==', 'agent').get();
    const mockAgents: { uid: string; location: GeoPoint; fcm_token?: string }[] = [];
    const nearby = agentsWithinRadius(tournamentLocation, mockAgents, radiusKm);

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
