import { useCallback, useEffect, useState } from 'react';
import type { MedicalAppointment } from '../models/MedicalAppointment';
import { medicalAppointmentsService } from '../services/medicalAppointments.service';
import { requiresPhysioConfirmation } from '../utils/visioMeetingLink';

export function usePhysioAppointments(physioUid: string | undefined, daysAhead = 14) {
  const [appointments, setAppointments] = useState<MedicalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!physioUid) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const from = startOfDay(new Date());
      const to = endOfDay(addDays(from, daysAhead));
      const list = await medicalAppointmentsService.listForPhysio(physioUid, from, to);
      setAppointments(list);
    } finally {
      setLoading(false);
    }
  }, [physioUid, daysAhead]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const today = startOfDay(new Date());
  const todayAppointments = appointments.filter(
    (a) =>
      a.start_at >= today &&
      a.start_at <= endOfDay(today) &&
      a.status !== 'cancelled'
  );
  const pendingCount = appointments.filter((a) => requiresPhysioConfirmation(a)).length;

  return {
    appointments,
    todayAppointments,
    pendingCount,
    loading,
    refresh,
  };
}
