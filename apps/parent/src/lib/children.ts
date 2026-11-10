import { supabase } from '@/lib/supabase';

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
export const WEEKDAY_LABEL: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri',
};

export interface Child {
  id: string;
  name: string;
  grade: string | null;
  homeAddress: string | null;
  driverId: string;
  pickupDays: string[];
  dropoffDays: string[];
}

/** A short human summary like "Mon–Fri", "Mon, Wed, Fri" or "None". */
export function summarizeDays(days: string[]): string {
  const ordered = WEEKDAYS.filter((d) => days.includes(d));
  if (ordered.length === 0) return 'None';
  if (ordered.length === 5) return 'Mon–Fri';
  return ordered.map((d) => WEEKDAY_LABEL[d]).join(', ');
}

/** The children linked to the signed-in parent (RLS scopes to parent_id). */
export async function listMyChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, grade, home_address, driver_id, pickup_days, dropoff_days')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    grade: r.grade ?? null,
    homeAddress: r.home_address ?? null,
    driverId: r.driver_id,
    pickupDays: r.pickup_days ?? [...WEEKDAYS],
    dropoffDays: r.dropoff_days ?? [...WEEKDAYS],
  }));
}

export async function getChild(id: string): Promise<Child | null> {
  const children = await listMyChildren();
  return children.find((c) => c.id === id) ?? null;
}

/** Parent sets which weekdays the child needs pickup / drop-off. */
export async function setSchedule(
  studentId: string,
  pickupDays: string[],
  dropoffDays: string[],
): Promise<void> {
  const { error } = await supabase.rpc('set_ride_schedule', {
    p_student: studentId,
    p_pickup: pickupDays,
    p_dropoff: dropoffDays,
  });
  if (error) throw new Error(error.message);
}

/** Accepts an invite token, binding this parent to the student. Returns the
 *  student's id + name on success. Throws with a friendly message otherwise. */
export async function acceptInvite(token: string): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase.rpc('accept_invite', { invite_token: token });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Invite not found');
  return { id: row.student_id as string, name: row.student_name as string };
}
