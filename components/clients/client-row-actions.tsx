'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientEditDialog } from './client-edit-dialog'
import { deleteClient } from '@/actions/clients'
import type { Client } from '@/types/db'

interface Props {
  client: Client
}

export function ClientRowActions({ client: initial }: Props) {
  const router = useRouter()
  const [client, setClient] = React.useState(initial)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    if (!confirm(`Delete ${client.name}? This will also delete all their sessions.`)) return
    setDeleting(true)
    try {
      await deleteClient(client.id)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ClientEditDialog
        client={client}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => {
          setClient((prev) => ({ ...prev, ...updated }))
          router.refresh()
        }}
      />
    </>
  )
}
