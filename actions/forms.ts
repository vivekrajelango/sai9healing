'use server'

import { revalidatePath } from 'next/cache'
import { createInsforgeServerClient } from '@/lib/insforge-server'
import type { Form, FormQuestion, FormWithQuestions, FormSubmission, FormAnswer, FormSubmissionWithAnswers, QuestionType } from '@/types/db'

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

// ── Forms ──────────────────────────────────────────────────────────────────

export async function getForms(): Promise<Form[]> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Form[]
}

export async function getFormWithQuestions(formId: string): Promise<FormWithQuestions | null> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('forms')
    .select('*, form_questions(*)')
    .eq('id', formId)
    .single()
  if (error) return null
  const form = data as FormWithQuestions
  form.form_questions = (form.form_questions ?? []).sort((a, b) => a.sort_order - b.sort_order)
  return form
}

export async function getFormBySlug(slug: string): Promise<FormWithQuestions | null> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('forms')
    .select('*, form_questions(*)')
    .eq('slug', slug)
    .single()
  if (error) return null
  const form = data as FormWithQuestions
  form.form_questions = (form.form_questions ?? []).sort((a, b) => a.sort_order - b.sort_order)
  return form
}

export async function createForm(input: { title: string; description?: string }): Promise<Form> {
  const insforge = createInsforgeServerClient()
  const slug = generateSlug()
  const { data, error } = await insforge.database
    .from('forms')
    .insert([{ title: input.title, description: input.description ?? null, slug }])
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/create-form')
  return data as Form
}

export async function updateForm(id: string, input: { title: string; description?: string }) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('forms')
    .update({ title: input.title, description: input.description ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/create-form')
  revalidatePath(`/create-form/${id}`)
}

export async function deleteForm(id: string) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('forms')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/create-form')
}

// ── Questions ──────────────────────────────────────────────────────────────

export async function addQuestion(input: {
  form_id: string
  question_text: string
  question_type: QuestionType
  options?: string[]
  required?: boolean
  sort_order: number
}): Promise<FormQuestion> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('form_questions')
    .insert([{
      form_id: input.form_id,
      question_text: input.question_text,
      question_type: input.question_type,
      options: input.options ?? [],
      required: input.required ?? false,
      sort_order: input.sort_order,
    }])
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/create-form/${input.form_id}`)
  return data as FormQuestion
}

export async function updateQuestion(id: string, input: {
  question_text: string
  question_type: QuestionType
  options?: string[]
  required?: boolean
}) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('form_questions')
    .update({
      question_text: input.question_text,
      question_type: input.question_type,
      options: input.options ?? [],
      required: input.required ?? false,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteQuestion(id: string, formId: string) {
  const insforge = createInsforgeServerClient()
  const { error } = await insforge.database
    .from('form_questions')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/create-form/${formId}`)
}

export async function reorderQuestions(formId: string, orderedIds: string[]) {
  const insforge = createInsforgeServerClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      insforge.database
        .from('form_questions')
        .update({ sort_order: index })
        .eq('id', id)
    )
  )
  revalidatePath(`/create-form/${formId}`)
}

// ── Submissions ────────────────────────────────────────────────────────────

export async function submitForm(input: {
  form_id: string
  respondent_name: string
  respondent_email: string
  respondent_phone?: string
  answers: { question_id: string; answer_text?: string; answer_options?: string[] }[]
}) {
  const insforge = createInsforgeServerClient()

  const { data: sub, error: subErr } = await insforge.database
    .from('form_submissions')
    .insert([{
      form_id: input.form_id,
      respondent_name: input.respondent_name,
      respondent_email: input.respondent_email,
      respondent_phone: input.respondent_phone ?? null,
    }])
    .select()
    .single()
  if (subErr) throw new Error(subErr.message)

  if (input.answers.length > 0) {
    const { error: ansErr } = await insforge.database
      .from('form_answers')
      .insert(
        input.answers.map((a) => ({
          submission_id: sub.id,
          question_id: a.question_id,
          answer_text: a.answer_text ?? null,
          answer_options: a.answer_options ?? [],
        }))
      )
    if (ansErr) throw new Error(ansErr.message)
  }

  revalidatePath('/form-status')
}

export async function getSubmissionsForForm(formId: string): Promise<FormSubmissionWithAnswers[]> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('form_submissions')
    .select('*, form_answers(*)')
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as FormSubmissionWithAnswers[]
}

export async function getAllSubmissions(): Promise<(FormSubmission & { form_title: string })[]> {
  const insforge = createInsforgeServerClient()
  const { data, error } = await insforge.database
    .from('form_submissions')
    .select('*, forms(title)')
    .order('submitted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as (FormSubmission & { forms: { title: string } })[]).map((r) => ({
    ...r,
    form_title: r.forms?.title ?? '—',
  }))
}
