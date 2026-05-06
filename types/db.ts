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
  teams_meeting_url: string | null
  amount_due: string
  balance: string
  created_at: string
}

export interface SessionWithRelations extends Session {
  clients: Pick<Client, 'id' | 'name' | 'contact' | 'email'>
  session_types: Pick<SessionType, 'id' | 'name'>
}

export interface SessionPayment {
  id: string
  session_id: string
  payment_date: string
  amount: string
  note: string | null
  created_at: string
}

export type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'true_false' | 'number'

export interface Form {
  id: string
  title: string
  description: string | null
  slug: string
  created_at: string
  updated_at: string
}

export interface FormQuestion {
  id: string
  form_id: string
  question_text: string
  question_type: QuestionType
  options: string[]
  required: boolean
  sort_order: number
  created_at: string
}

export interface FormSubmission {
  id: string
  form_id: string
  respondent_name: string
  respondent_email: string
  respondent_phone: string | null
  submitted_at: string
}

export interface FormAnswer {
  id: string
  submission_id: string
  question_id: string
  answer_text: string | null
  answer_options: string[]
}

export interface FormWithQuestions extends Form {
  form_questions: FormQuestion[]
}

export interface FormSubmissionWithAnswers extends FormSubmission {
  form_answers: FormAnswer[]
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
