export type TeamPaymentStatus = 'pending' | 'paid' | 'late';
export type TeamPaymentMethod = 'manual' | 'stripe';

export interface TeamPaymentRequest {
  id: string;
  club_id: string;
  label: string;
  amount_eur: number;
  due_at: Date;
  member_uid: string;
  member_name: string;
  status: TeamPaymentStatus;
  payment_method?: TeamPaymentMethod;
  stripe_checkout_session_id?: string;
  paid_at?: Date;
  created_by_uid: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTeamPaymentRequestInput {
  club_id: string;
  label: string;
  amount_eur: number;
  due_at: Date;
  member_uid: string;
  member_name: string;
  created_by_uid: string;
}
