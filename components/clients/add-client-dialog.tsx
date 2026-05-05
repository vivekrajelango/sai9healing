'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
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
import { createClient } from '@/actions/clients'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  countryCode: z.string().regex(/^\+\d+$/, 'e.g. +44'),
  phoneNumber: z.string().min(1, 'Mobile number is required'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function AddClientDialog() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', countryCode: '+44', phoneNumber: '', notes: '' },
  })

  function handleClose(o: boolean) {
    setOpen(o)
    if (!o) {
      form.reset({ name: '', email: '', countryCode: '+44', phoneNumber: '', notes: '' })
      setError(null)
    }
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setError(null)
    try {
      await createClient({
        name: values.name,
        email: values.email,
        contact: `${values.countryCode} ${values.phoneNumber}`.trim(),
        notes: values.notes || undefined,
      })
      handleClose(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input placeholder="Client name" autoFocus {...form.register('name')} />
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
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
