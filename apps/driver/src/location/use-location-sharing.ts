import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { goOffline, publishLocation } from '@/lib/location';

export type SharingState = 'idle' | 'requesting' | 'denied' | 'sharing' | 'error';

export interface SharingInfo {
  state: SharingState;
  last: { lat: number; lng: number; speedKmh: number } | null;
}

/**
 * While `active` is true (and a driverId is known), requests foreground
 * location permission and streams the driver's position to Supabase
 * (van_locations) so linked parents can track the van live over realtime.
 * Marks the driver offline when `active` turns false or on unmount.
 */
export function useLocationSharing(active: boolean, driverId?: string): SharingInfo {
  const [state, setState] = useState<SharingState>('idle');
  const [last, setLast] = useState<SharingInfo['last']>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!driverId) return;
      try {
        setState('requesting');
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!granted) {
          setState('denied');
          return;
        }
        subRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
          (pos) => {
            const { latitude, longitude, heading, speed } = pos.coords;
            const speedKmh = Math.max(0, Math.round((speed ?? 0) * 3.6));
            publishLocation(driverId, {
              lat: latitude,
              lng: longitude,
              headingDeg: heading ?? 0,
              speedKmh,
            });
            setLast({ lat: latitude, lng: longitude, speedKmh });
            setState('sharing');
          },
        );
      } catch {
        if (!cancelled) setState('error');
      }
    }

    function stop() {
      subRef.current?.remove();
      subRef.current = null;
    }

    if (active && driverId) {
      start();
    } else {
      stop();
      setState('idle');
      setLast(null);
      if (driverId) goOffline(driverId);
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, driverId]);

  return { state, last };
}
