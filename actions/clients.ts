'use server'

import { revalidatePath } from 'next/cache'
import { createInsforgeServerClient } from '@/lib/insforge-server'
import type { Client } from '@/types/db'

export async function getClients(): Promise<Client[]> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('clients')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Client[]
}

export async function createClient(input: { name: string; email?: string; contact?: string; notes?: string }) {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('clients')
    .insert([{ name: input.name, email: input.email ?? null, contact: input.contact ?? null, notes: input.notes ?? null }])
    .select()
    .maybeSingle()
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath('/sessions')
  return data as Client
}

export async function updateClient(id: string, input: { name?: string; email?: string | null; contact?: string | null; notes?: string | null }) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('clients')
    .update(input)
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
}

export async function deleteClient(id: string) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('clients')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
}
