/**
 * Push distant : le client écrit `staff_notifications` ;
 * Cloud Functions peuvent appeler Expo Push / FCM si déployées.
 * Ce module ne simule plus d’envoi — préférer staffNotificationsService.
 */
export const notificationService = {
  async sendPush(
    uid: string,
    _fcmToken: string | undefined,
    payload: { title: string; body: string },
  ): Promise<void> {
    console.warn(
      `[push] stub client déprécié → ${uid} · ${payload.title}. Utiliser staff_notifications + CF.`,
    );
  },
};
