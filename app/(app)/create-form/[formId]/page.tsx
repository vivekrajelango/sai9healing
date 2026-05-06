import { notFound } from 'next/navigation'
import { FormBuilderClient } from '@/components/forms/form-builder-client'
import { getFormWithQuestions } from '@/actions/forms'

export const dynamic = 'force-dynamic'

export default async function FormBuilderPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  const form = await getFormWithQuestions(formId)
  if (!form) notFound()
  return <FormBuilderClient form={form} />
}
