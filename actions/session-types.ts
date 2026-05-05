'use server'

import { revalidatePath } from 'next/cache'
import { createInsforgeServerClient } from '@/lib/insforge-server'
import type { SessionType } from '@/types/db'

export async function getSessionTypes(activeOnly = true): Promise<SessionType[]> {
  const insforge = createInsforgeServerClient()
  let q = insforge.database
    .from('session_types')
    .select('*')
    .order('name', { ascending: true })
  if (activeOnly) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as SessionType[]
}

export async function createSessionType(input: { name: string; default_rate: number; default_hours: number }) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('session_types')
    .insert([{ name: input.name, default_rate: input.default_rate, default_hours: input.default_hours, active: true }])
  if (error) throw new Error(error.message)
  revalidatePath('/settings/session-types')
  revalidatePath('/sessions')
}

export async function updateSessionType(
  id: string,
  input: { name?: string; default_rate?: number; default_hours?: number; active?: boolean }
) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('session_types')
    .update(input)
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/session-types')
  revalidatePath('/sessions')
}

export async function deleteSessionType(id: string) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('session_types')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/session-types')
}
