'use client'

import * as React from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import { updateAmountPaid } from '@/actions/sessions'

interface Props {
  sessionId: string
  amountPaid: string
  amountDue: string
  paymentNote: string | null
  onSaved?: () => void
}

export function InlinePaymentEdit({ sessionId, amountPaid, amountDue, paymentNote, onSaved }: Props) {
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState(amountPaid)
  const [note, setNote] = React.useState(paymentNote ?? '')
  const [loading, setLoading] = React.useState(false)

  async function save() {
    setLoading(true)
    try {
      await updateAmountPaid(sessionId, parseFloat(value) || 0, note || undefined)
      onSaved?.()
      setEditing(false)
    } finally {
      setLoading(false)
    }
  }

  function cancel() {
    setValue(amountPaid)
    setNote(paymentNote ?? '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-end gap-1 group">
        <span>{formatCurrency(amountPaid)}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        min="0"
        max={amountDue}
        className="h-7 w-24 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <Input
        className="h-7 w-32 text-sm"
        placeholder="Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save} disabled={loading}>
        <Check className="h-3.5 w-3.5 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancel}>
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  )
}
