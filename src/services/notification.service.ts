/**
 * Push distant : le client écrit `staff_notifications` (ou met à jour un booking) ;
 * Cloud Functions `onStaffNotificationCreated` / `onCoachSessionBookingUpdated`
 * appellent Expo Push / FCM via `functions/src/messaging.ts`.
 *
 * Ne plus utiliser ce stub pour simuler un envoi — préférer staffNotificationsService.
 */
export const notificationService = {
  async sendPush(
    uid: string,
    _fcmToken: string | undefined,
    payload: { title: string; body: string },
  ): Promise<void> {
    console.warn(
      `[push deprecated client stub → ${uid}] ${payload.title}. Use staff_notifications CF.`,
    );
  },
};
