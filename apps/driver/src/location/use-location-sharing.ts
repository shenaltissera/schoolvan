import { api } from '@schoolvan/shared';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export type SharingState = 'idle' | 'requesting' | 'denied' | 'sharing' | 'error';

export interface SharingInfo {
  state: SharingState;
  last: { lat: number; lng: number; speedKmh: number } | null;
}

/**
 * While `active` is true, requests foreground location permission and streams
 * the driver's position to the shared store via api.updateVanLocation — the
 * single "publish location" seam a backend/realtime channel will plug into so
 * the position reaches parents' devices. Stops and clears when `active` flips
 * to false or the component unmounts.
 */
export function useLocationSharing(active: boolean): SharingInfo {
  const [state, setState] = useState<SharingState>('idle');
  const [last, setLast] = useState<SharingInfo['last']>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
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
            api.updateVanLocation({
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

    if (active) {
      start();
    } else {
      stop();
      setState('idle');
      setLast(null);
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [active]);

  return { state, last };
}
