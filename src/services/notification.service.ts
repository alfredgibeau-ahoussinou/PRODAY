export const notificationService = {
  async sendPush(
    uid: string,
    _fcmToken: string | undefined,
    payload: { title: string; body: string }
  ): Promise<void> {
    // [FIREBASE] messaging.send({ token: fcmToken, notification: payload });
    console.log(`[FCM → ${uid}] ${payload.title}: ${payload.body}`);
  },
};
