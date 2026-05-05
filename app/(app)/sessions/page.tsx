import { SessionsClient } from '@/components/sessions/sessions-client'
import { getSessions } from '@/actions/sessions'
import { getClients } from '@/actions/clients'
import { getSessionTypes } from '@/actions/session-types'

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const [clients, sessionTypes, sessions] = await Promise.all([
    getClients(),
    getSessionTypes(),
    getSessions({}),
  ])

  return (
    <SessionsClient
      initialClients={clients}
      sessionTypes={sessionTypes}
      initialSessions={sessions}
    />
  )
}
