import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface Alert {
  id: string;
  studentId: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

function toAlert(row: Record<string, any>): Alert {
  return {
    id: row.id,
    studentId: row.student_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    read: !!row.read,
    createdAt: row.created_at,
  };
}

export async function listAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toAlert);
}

export async function markAlertRead(id: string): Promise<void> {
  await supabase.from('alerts').update({ read: true }).eq('id', id);
}

/** The parent's alerts (RLS-scoped to their children), kept live via realtime. */
export function useAlerts(): { alerts: Alert[]; loading: boolean; reload: () => void } {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    listAlerts()
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      supabase.realtime.setAuth(data.session?.access_token ?? null);
      if (!active) return;
      reload();
      channel = supabase
        .channel('alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => reload())
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { alerts, loading, reload };
}
