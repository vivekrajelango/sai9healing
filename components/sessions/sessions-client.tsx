'use client'

import * as React from 'react'
import { AddSessionModal } from './add-session-modal'
import { SessionsTable } from './sessions-table'
import { getSessions } from '@/actions/sessions'
import type { Client, SessionType, SessionWithRelations } from '@/types/db'
import type { SessionFilters } from '@/actions/sessions'

interface Props {
  initialClients: Client[]
  sessionTypes: SessionType[]
  initialSessions: SessionWithRelations[]
}

export function SessionsClient({ initialClients, sessionTypes, initialSessions }: Props) {
  const [clients, setClients] = React.useState(initialClients)
  const [sessions, setSessions] = React.useState(initialSessions)
  const [filters, setFilters] = React.useState<SessionFilters>({})
  const [loading, setLoading] = React.useState(false)

  // Re-fetch when filters change (skip on mount — server already fetched)
  const mounted = React.useRef(false)
  React.useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    setLoading(true)
    getSessions(filters).then(setSessions).finally(() => setLoading(false))
  }, [filters])

  function handleFilterChange(f: { month?: string; clientId?: string; paid?: string }) {
    setFilters(f as SessionFilters)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AddSessionModal
          clients={clients}
          sessionTypes={sessionTypes}
          onClientCreated={(c) => setClients((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))}
          onSessionCreated={() => {
            getSessions(filters).then(setSessions)
          }}
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <SessionsTable
          sessions={sessions}
          clients={clients}
          sessionTypes={sessionTypes}
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          onDataChanged={() => getSessions(filters).then(setSessions)}
        />
      )}
    </div>
  )
}
