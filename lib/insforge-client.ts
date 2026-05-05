import { createClient } from '@insforge/sdk'

let client: ReturnType<typeof createClient> | null = null

export function getInsforgeClient() {
  if (!client) {
    client = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    })
  }
  return client
}
