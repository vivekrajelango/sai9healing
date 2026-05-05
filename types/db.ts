export interface Client {
  id: string
  name: string
  email: string | null
  contact: string | null
  notes: string | null
  created_at: string
}

export interface SessionType {
  id: string
  name: string
  default_rate: string
  default_hours: string
  active: boolean
}

export interface Session {
  id: string
  client_id: string
  session_type_id: string
  session_date: string
  session_time: string | null
  hours: string
  rate: string
  amount_paid: string
  payment_note: string | null
  amount_due: string
  balance: string
  created_at: string
}

export interface SessionWithRelations extends Session {
  clients: Pick<Client, 'id' | 'name' | 'contact' | 'email'>
  session_types: Pick<SessionType, 'id' | 'name'>
}

export interface ClientWithTotals {
  id: string
  name: string
  contact: string | null
  total_billed: number
  total_paid: number
  balance: number
  last_session_date: string | null
}
