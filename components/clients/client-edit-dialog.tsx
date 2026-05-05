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
import { updateClient } from '@/actions/clients'
import type { Client } from '@/types/db'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  countryCode: z.string().regex(/^\+\d+$/, 'e.g. +44'),
  phoneNumber: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function parseContact(contact: string | null): { countryCode: string; phoneNumber: string } {
  if (!contact) return { countryCode: '+44', phoneNumber: '' }
  const match = contact.match(/^(\+\d+)\s*(.*)$/)
  if (match) return { countryCode: match[1], phoneNumber: match[2] }
  return { countryCode: '+44', phoneNumber: contact }
}

interface Props {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (updated: Partial<Client>) => void
}

export function ClientEditDialog({ client, open, onOpenChange, onSaved }: Props) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client.name,
      email: client.email ?? '',
      ...parseContact(client.contact ?? null),
      notes: client.notes ?? '',
    },
  })

  // Reset form when client changes
  React.useEffect(() => {
    form.reset({
      name: client.name,
      email: client.email ?? '',
      ...parseContact(client.contact ?? null),
      notes: client.notes ?? '',
    })
  }, [client, form])

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setError(null)
    try {
      const contact = values.phoneNumber
        ? `${values.countryCode} ${values.phoneNumber}`.trim()
        : null
      await updateClient(client.id, {
        name: values.name,
        email: values.email,
        contact,
        notes: values.notes || null,
      })
      onSaved({ name: values.name, email: values.email, contact, notes: values.notes || null })
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
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input placeholder="Client name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" placeholder="client@example.com" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Mobile Number</Label>
            <div className="flex gap-2">
              <Input
                className="w-20 shrink-0"
                placeholder="+44"
                {...form.register('countryCode')}
              />
              <Input
                className="flex-1"
                placeholder="7700 000000"
                {...form.register('phoneNumber')}
              />
            </div>
            {(form.formState.errors.countryCode || form.formState.errors.phoneNumber) && (
              <p className="text-xs text-destructive">
                {form.formState.errors.phoneNumber?.message ?? form.formState.errors.countryCode?.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Input placeholder="Optional" {...form.register('notes')} />
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
