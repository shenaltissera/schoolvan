import { supabase } from '@/lib/supabase';

export interface Child {
  id: string;
  name: string;
  grade: string | null;
  homeAddress: string | null;
}

/** The children linked to the signed-in parent (RLS scopes to parent_id). */
export async function listMyChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, grade, home_address')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    grade: r.grade ?? null,
    homeAddress: r.home_address ?? null,
  }));
}

/** Accepts an invite token, binding this parent to the student. Returns the
 *  student's name on success. Throws with a friendly message otherwise. */
export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invite', { invite_token: token });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Invite not found');
  return row.student_name as string;
}
