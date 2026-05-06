'use client'

import * as React from 'react'
import { Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { InlinePaymentEdit } from './inline-payment-edit'
import { SessionEditDialog } from './session-edit-dialog'
import { SessionPaymentHistory } from './session-payment-history'
import { deleteSession } from '@/actions/sessions'
import { formatCurrency, formatDate } from '@/lib/format'
import type { SessionWithRelations, Client, SessionType } from '@/types/db'

interface Props {
  sessions: SessionWithRelations[]
  clients: Client[]
  sessionTypes: SessionType[]
  onFilterChange: (filters: { month?: string; clientId?: string; paid?: string }) => void
  currentFilters: { month?: string; clientId?: string; paid?: string }
  onDataChanged: () => void
}

function monthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export function SessionsTable({
  sessions,
  clients,
  sessionTypes,
  onFilterChange,
  currentFilters,
  onDataChanged,
}: Props) {
  const months = monthOptions()
  const [editingSession, setEditingSession] = React.useState<SessionWithRelations | null>(null)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this session?')) return
    await deleteSession(id)
    onDataChanged()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={currentFilters.month ?? 'all'}
          onValueChange={(v) =>
            onFilterChange({ ...currentFilters, month: v === 'all' ? undefined : v })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-52">
          <Combobox
            options={[
              { value: 'all', label: 'All clients' },
              ...clients.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={currentFilters.clientId ?? 'all'}
            onValueChange={(v) =>
              onFilterChange({ ...currentFilters, clientId: v === 'all' ? undefined : v })
            }
            placeholder="All clients"
            searchPlaceholder="Search clients..."
          />
        </div>

        <Select
          value={currentFilters.paid ?? 'all'}
          onValueChange={(v) =>
            onFilterChange({ ...currentFilters, paid: v === 'all' ? undefined : v })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* Table */}
      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No sessions found. Add one to get started.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-32" />
              <col className="w-36" />
              <col className="w-40" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-20" />
              <col className="w-20" />
            </colgroup>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Hours</th>
                <th className="px-4 py-3 text-right font-medium">Rate</th>
                <th className="px-4 py-3 text-right font-medium">Due</th>
                <th className="px-4 py-3 text-right font-medium">Paid</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const balance = parseFloat(s.balance ?? '0')
                const isPaid = balance <= 0
                const isExpanded = expandedId === s.id
                return (
                  <React.Fragment key={s.id}>
                    <tr
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => toggleRow(s.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          {formatDate(s.session_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{s.clients?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.session_types?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{parseFloat(s.hours).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(s.rate)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(s.amount_due)}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <InlinePaymentEdit
                          sessionId={s.id}
                          amountPaid={s.amount_paid}
                          amountDue={s.amount_due}
                          paymentNote={s.payment_note}
                          onSaved={onDataChanged}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(s.balance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={isPaid ? 'success' : 'warning'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingSession(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <SessionPaymentHistory
                            sessionId={s.id}
                            amountDue={s.amount_due}
                            onChanged={onDataChanged}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingSession && (
        <SessionEditDialog
          session={editingSession}
          clients={clients}
          sessionTypes={sessionTypes}
          open={!!editingSession}
          onOpenChange={(o) => { if (!o) setEditingSession(null) }}
          onSaved={() => {
            setEditingSession(null)
            onDataChanged()
          }}
        />
      )}
    </div>
  )
}
