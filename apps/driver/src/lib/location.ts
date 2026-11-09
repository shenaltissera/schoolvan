import { supabase } from '@/lib/supabase';

/** Publishes the driver's current position (marks them online). */
export async function publishLocation(
  driverId: string,
  pos: { lat: number; lng: number; headingDeg: number; speedKmh: number },
): Promise<void> {
  await supabase.from('van_locations').upsert({
    driver_id: driverId,
    lat: pos.lat,
    lng: pos.lng,
    heading: pos.headingDeg,
    speed_kmh: pos.speedKmh,
    online: true,
    updated_at: new Date().toISOString(),
  });
}

/** Marks the driver offline (stops live tracking for parents). */
export async function goOffline(driverId: string): Promise<void> {
  await supabase
    .from('van_locations')
    .update({ online: false, updated_at: new Date().toISOString() })
    .eq('driver_id', driverId);
}
