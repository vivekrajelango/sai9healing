import { FormListClient } from '@/components/forms/form-list-client'
import { getForms } from '@/actions/forms'

export const dynamic = 'force-dynamic'

export default async function CreateFormPage() {
  const forms = await getForms()
  return <FormListClient forms={forms} />
}
