import { supabase } from '@/lib/supabase';

export type CurrentUserRole =
  | { kind: 'anonymous' }
  | { kind: 'dietitian'; userId: string; email: string; name: string }
  | {
      kind: 'client';
      userId: string;
      clientId: string;
      dietitianId: string;
      name: string;
    }
  | { kind: 'archived_client'; userId: string }
  | { kind: 'unprovisioned'; userId: string; email: string };

export async function getCurrentRole(): Promise<CurrentUserRole> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { kind: 'anonymous' };
  const { id, email } = data.user;

  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('id, email, name')
    .eq('id', id)
    .maybeSingle();
  if (dietitian) {
    return {
      kind: 'dietitian',
      userId: id,
      email: dietitian.email,
      name: dietitian.name,
    };
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, dietitian_id, name, archived_at')
    .eq('user_id', id)
    .maybeSingle();
  if (client) {
    if (client.archived_at !== null) {
      return { kind: 'archived_client', userId: id };
    }
    return {
      kind: 'client',
      userId: id,
      clientId: client.id,
      dietitianId: client.dietitian_id,
      name: client.name,
    };
  }

  return { kind: 'unprovisioned', userId: id, email: email ?? '' };
}
