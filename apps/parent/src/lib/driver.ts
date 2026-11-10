import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface DriverInfo {
  name: string;
  vehicleNumber: string;
  photoUrl: string | null;
  assistantName: string | null;
  assistantPhotoUrl: string | null;
}

export async function getDriver(driverId: string): Promise<DriverInfo | null> {
  const { data, error } = await supabase
    .from('drivers')
    .select('driver_name, vehicle_number, driver_photo_url, assistant_name, assistant_photo_url')
    .eq('id', driverId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    name: data.driver_name,
    vehicleNumber: data.vehicle_number,
    photoUrl: data.driver_photo_url ?? null,
    assistantName: data.assistant_name ?? null,
    assistantPhotoUrl: data.assistant_photo_url ?? null,
  };
}

/** The driver of the given child's van (or null until loaded). */
export function useDriver(driverId?: string): DriverInfo | null {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  useEffect(() => {
    if (!driverId) {
      setDriver(null);
      return;
    }
    let active = true;
    getDriver(driverId).then((d) => {
      if (active) setDriver(d);
    });
    return () => {
      active = false;
    };
  }, [driverId]);
  return driver;
}
