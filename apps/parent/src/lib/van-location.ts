import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface VanLocation {
  lat: number | null;
  lng: number | null;
  heading: number | null;
  speedKmh: number | null;
  online: boolean;
  updatedAt: string;
}

function toVanLocation(row: Record<string, any>): VanLocation {
  return {
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    heading: row.heading ?? null,
    speedKmh: row.speed_kmh ?? null,
    online: !!row.online,
    updatedAt: row.updated_at,
  };
}

export async function getVanLocation(driverId: string): Promise<VanLocation | null> {
  const { data, error } = await supabase
    .from('van_locations')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle();
  if (error || !data) return null;
  return toVanLocation(data);
}

/**
 * Live van location for a driver: fetches the current value, then subscribes to
 * realtime updates. Returns the latest VanLocation (or null until it loads).
 */
export function useVanLocation(driverId?: string): VanLocation | null {
  const [location, setLocation] = useState<VanLocation | null>(null);

  useEffect(() => {
    if (!driverId) {
      setLocation(null);
      return;
    }
    let active = true;
    getVanLocation(driverId).then((loc) => {
      if (active) setLocation(loc);
    });

    const channel = supabase
      .channel(`van:${driverId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'van_locations', filter: `driver_id=eq.${driverId}` },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length) {
            setLocation(toVanLocation(payload.new as Record<string, any>));
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return location;
}
