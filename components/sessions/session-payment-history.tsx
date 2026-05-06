'use client'

import * as React from 'react'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { getSessionPayments, addSessionPayment, deleteSessionPayment } from '@/actions/sessions'
import type { SessionPayment } from '@/types/db'

interface Props {
  sessionId: string
  amountDue: string
  onChanged: () => void
}

export function SessionPaymentHistory({ sessionId, amountDue, onChanged }: Props) {
  const [payments, setPayments] = React.useState<SessionPayment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [adding, setAdding] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = React.useState('')
  const [note, setNote] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    getSessionPayments(sessionId).then(setPayments).finally(() => setLoading(false))
  }, [sessionId])

  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount ?? '0'), 0)
  const balance = parseFloat(amountDue ?? '0') - totalPaid

  async function handleAdd() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    setError(null)
    try {
      await addSessionPayment(sessionId, { payment_date: date, amount: amt, note: note || undefined })
      const updated = await getSessionPayments(sessionId)
      setPayments(updated)
      setAmount('')
      setNote('')
      setAdding(false)
      onChanged()
    } catch {
      setError('Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(paymentId: string) {
    if (!confirm('Remove this payment entry?')) return
    await deleteSessionPayment(paymentId, sessionId)
    const updated = await getSessionPayments(sessionId)
    setPayments(updated)
    onChanged()
  }

  return (
    <div className="px-6 py-4 bg-muted/20 border-t">
      <div className="max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment History
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setAdding(true); setError(null) }}>
            <Plus className="h-3 w-3" />
            Add Payment
          </Button>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : payments.length === 0 && !adding ? (
          <p className="text-xs text-muted-foreground italic">No payment records yet.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Note</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 bg-background">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                    <td className="px-3 py-2 text-right font-medium text-green-700">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.note ?? '—'}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}

                {adding && (
                  <tr className="border-t bg-muted/30">
                    <td className="px-2 py-1.5">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-7 text-xs text-right"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        placeholder="Note (optional)"
                        className="h-7 text-xs"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd} disabled={saving}>
                          <Plus className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAdding(false); setError(null) }}>
                          <span className="text-muted-foreground text-xs">✕</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Summary footer */}
              <tfoot>
                <tr className="border-t bg-muted/50">
                  <td className="px-3 py-2 text-xs font-medium text-muted-foreground">Total</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-green-700">
                    {formatCurrency(totalPaid)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    Balance:
                    <span className={`ml-1 font-semibold ${balance > 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    </div>
  )
}
