'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { updateSession } from '@/actions/sessions'
import type { Client, SessionType, SessionWithRelations } from '@/types/db'

const schema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  session_type_id: z.string().min(1, 'Session type is required'),
  session_date: z.string().min(1, 'Date is required'),
  session_time: z.string().optional(),
  hours: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Must be positive'),
  rate: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Must be 0 or more'),
  amount_paid: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Must be 0 or more'),
  payment_note: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  session: SessionWithRelations
  clients: Client[]
  sessionTypes: SessionType[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function SessionEditDialog({
  session,
  clients,
  sessionTypes,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: session.client_id,
      session_type_id: session.session_type_id,
      session_date: session.session_date,
      session_time: session.session_time ?? '',
      hours: String(session.hours),
      rate: String(session.rate),
      amount_paid: String(session.amount_paid),
      payment_note: session.payment_note ?? '',
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        client_id: session.client_id,
        session_type_id: session.session_type_id,
        session_date: session.session_date,
        session_time: session.session_time ?? '',
        hours: String(session.hours),
        rate: String(session.rate),
        amount_paid: String(session.amount_paid),
        payment_note: session.payment_note ?? '',
      })
      setError(null)
    }
  }, [open, session, form])

  const selectedTypeId = form.watch('session_type_id')
  const selectedType = sessionTypes.find((t) => t.id === selectedTypeId)

  // Prefill rate when session type changes (only if user hasn't manually edited rate)
  const prevTypeId = React.useRef(session.session_type_id)
  React.useEffect(() => {
    if (selectedType && selectedTypeId !== prevTypeId.current) {
      form.setValue('rate', String(selectedType.default_rate))
      prevTypeId.current = selectedTypeId
    }
  }, [selectedType, selectedTypeId, form])

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setError(null)
    try {
      await updateSession(session.id, {
        client_id: values.client_id,
        session_type_id: values.session_type_id,
        session_date: values.session_date,
        session_time: values.session_time || undefined,
        hours: parseFloat(values.hours),
        rate: parseFloat(values.rate),
        amount_paid: parseFloat(values.amount_paid),
        payment_note: values.payment_note || undefined,
      })
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Client</Label>
            <Combobox
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={form.watch('client_id')}
              onValueChange={(v) => form.setValue('client_id', v)}
              placeholder="Select client..."
              searchPlaceholder="Search clients..."
            />
            {form.formState.errors.client_id && (
              <p className="text-xs text-destructive">{form.formState.errors.client_id.message}</p>
            )}
          </div>

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
              <Label>Hours</Label>
              <Input type="number" step="0.25" min="0.25" {...form.register('hours')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Rate (£)</Label>
              <Input type="number" step="0.01" min="0" {...form.register('rate')} />
            </div>
            <div className="grid gap-2">
              <Label>Amount Paid (£)</Label>
              <Input type="number" step="0.01" min="0" {...form.register('amount_paid')} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Payment Note</Label>
            <Input
              placeholder="e.g. £8.71 to pay for April"
              {...form.register('payment_note')}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
