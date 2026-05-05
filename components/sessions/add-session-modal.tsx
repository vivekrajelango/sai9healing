'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { createSession } from '@/actions/sessions'
import { createClient } from '@/actions/clients'
import { formatCurrency } from '@/lib/format'
import type { Client, SessionType } from '@/types/db'

const schema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  session_type_id: z.string().min(1, 'Session type is required'),
  session_date: z.string().min(1, 'Date is required'),
  session_time: z.string().optional(),
  rate: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Must be 0 or more'),
  payment_note: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const empty = {
  client_id: '',
  session_type_id: '',
  session_date: '',
  session_time: '',
  rate: '0',
  payment_note: '',
}

interface Props {
  clients: Client[]
  sessionTypes: SessionType[]
  onClientCreated?: (client: Client) => void
  onSessionCreated?: () => void
}

export function AddSessionModal({ clients, sessionTypes, onClientCreated, onSessionCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...empty, session_date: today },
  })

  const selectedTypeId = form.watch('session_type_id')
  const selectedType = sessionTypes.find((t) => t.id === selectedTypeId)

  // Prefill rate and hours whenever the session type changes
  React.useEffect(() => {
    if (selectedType) {
      form.setValue('rate', selectedType.default_rate)
    }
  }, [selectedType, form])

  function handleClose(o: boolean) {
    setOpen(o)
    if (!o) {
      form.reset({ ...empty, session_date: today })
      setError(null)
    }
  }

  async function handleCreateClient(name: string) {
    try {
      const newClient = await createClient({ name })
      onClientCreated?.(newClient)
      form.setValue('client_id', newClient.id)
    } catch {
      setError('Failed to create client')
    }
  }

  async function onSubmit(values: FormValues) {
    if (!selectedType) return
    setLoading(true)
    setError(null)
    try {
      await createSession({
        client_id: values.client_id,
        session_type_id: values.session_type_id,
        session_date: values.session_date,
        session_time: values.session_time || undefined,
        hours: parseFloat(selectedType.default_hours),
        rate: parseFloat(values.rate),
        amount_paid: 0,
        payment_note: values.payment_note || undefined,
      })
      form.reset({ ...empty, session_date: today })
      onSessionCreated?.()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">

          {/* Client */}
          <div className="grid gap-2">
            <Label>Client</Label>
            <Combobox
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={form.watch('client_id') ?? ''}
              onValueChange={(v) => form.setValue('client_id', v)}
              placeholder="Select or create client..."
              searchPlaceholder="Search clients..."
              emptyText="No clients found."
              onCreateNew={handleCreateClient}
              createNewLabel={(n) => `Create "${n}"`}
            />
            {form.formState.errors.client_id && (
              <p className="text-xs text-destructive">{form.formState.errors.client_id.message}</p>
            )}
          </div>

          {/* Session Type */}
          <div className="grid gap-2">
            <Label>Session Type</Label>
            <Select
              value={form.watch('session_type_id')}
              onValueChange={(v) => form.setValue('session_type_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.session_type_id && (
              <p className="text-xs text-destructive">
                {form.formState.errors.session_type_id.message}
              </p>
            )}
          </div>

          {/* Auto-filled info from session type */}
          {selectedType && (
            <div className="rounded-md bg-muted/50 border px-3 py-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Hours (from type)</span>
                <p className="font-medium">{parseFloat(selectedType.default_hours).toFixed(2)}h</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Amount due</span>
                <p className="font-medium">
                  {formatCurrency(
                    parseFloat(selectedType.default_hours) * parseFloat(form.watch('rate') || '0')
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Date + Time + Rate */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" {...form.register('session_date')} />
            </div>
            <div className="grid gap-2">
              <Label>Time <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="time" {...form.register('session_time')} />
            </div>
            <div className="grid gap-2">
              <Label>Rate (£)</Label>
              <Input type="number" step="0.01" min="0" {...form.register('rate')} />
            </div>
          </div>

          {/* Payment Note */}
          <div className="grid gap-2">
            <Label>Payment Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              placeholder="e.g. £8.71 pending for April"
              {...form.register('payment_note')}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedType}>
              {loading ? 'Saving...' : 'Add Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
