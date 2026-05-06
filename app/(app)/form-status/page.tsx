import { FormStatusClient } from '@/components/forms/form-status-client'
import { getForms, getSubmissionsForForm } from '@/actions/forms'
import { getFormWithQuestions } from '@/actions/forms'
import type { FormWithQuestions, FormSubmissionWithAnswers } from '@/types/db'

export const dynamic = 'force-dynamic'

export default async function FormStatusPage() {
  const forms = await getForms()

  const formsWithQuestions: FormWithQuestions[] = await Promise.all(
    forms.map((f) => getFormWithQuestions(f.id).then((r) => r!))
  )

  const submissionsByForm: Record<string, FormSubmissionWithAnswers[]> = {}
  await Promise.all(
    forms.map(async (f) => {
      submissionsByForm[f.id] = await getSubmissionsForForm(f.id)
    })
  )

  return <FormStatusClient forms={formsWithQuestions} submissionsByForm={submissionsByForm} />
}
