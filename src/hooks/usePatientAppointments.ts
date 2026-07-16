import { useCallback, useEffect, useState } from 'react';
import type { MedicalAppointment } from '../models/MedicalAppointment';
import { medicalAppointmentsService } from '../services/medicalAppointments.service';

export function usePatientAppointments(patientUid: string | undefined) {
  const [appointments, setAppointments] = useState<MedicalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!patientUid) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await medicalAppointmentsService.listForPatient(patientUid);
      setAppointments(list);
    } finally {
      setLoading(false);
    }
  }, [patientUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upcoming = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  );

  return { appointments, upcoming, loading, refresh };
}
