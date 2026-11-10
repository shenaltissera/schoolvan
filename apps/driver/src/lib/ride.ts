import type { RideStatus } from '@schoolvan/shared';

import { supabase } from '@/lib/supabase';

export type RideWindow = 'morning' | 'afternoon';

const today = () => new Date().toISOString().slice(0, 10);

/** Current ride statuses for the driver's students in a window today. */
export async function getRideStatuses(
  driverId: string,
  window: RideWindow,
): Promise<Record<string, RideStatus>> {
  const { data, error } = await supabase
    .from('ride_status')
    .select('student_id, status')
    .eq('driver_id', driverId)
    .eq('window', window)
    .eq('ride_date', today());
  if (error) throw error;
  const map: Record<string, RideStatus> = {};
  for (const r of data ?? []) map[r.student_id] = r.status as RideStatus;
  return map;
}

function buildAlert(name: string, window: RideWindow, status: 'onboard' | 'dropped') {
  if (status === 'onboard') {
    return window === 'morning'
      ? { kind: 'picked_up', title: 'Picked up', body: `${name} was picked up from home.` }
      : { kind: 'picked_up', title: 'Picked up from school', body: `${name} has boarded the van for the ride home.` };
  }
  return window === 'morning'
    ? { kind: 'dropped_off', title: 'Arrived at school', body: `${name} was dropped off at school safely.` }
    : { kind: 'dropped_off', title: 'Dropped off', body: `${name} was dropped off at home.` };
}

/** Sets a student's ride status and, on pickup/drop-off, notifies the parent. */
export async function setRideStatus(
  driverId: string,
  student: { id: string; name: string },
  window: RideWindow,
  status: RideStatus,
): Promise<void> {
  const { error } = await supabase.from('ride_status').upsert(
    {
      student_id: student.id,
      driver_id: driverId,
      window,
      ride_date: today(),
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,window,ride_date' },
  );
  if (error) throw error;

  if (status === 'onboard' || status === 'dropped') {
    const a = buildAlert(student.name, window, status);
    await supabase.from('alerts').insert({
      student_id: student.id,
      kind: a.kind,
      title: a.title,
      body: a.body,
    });
  }
}
