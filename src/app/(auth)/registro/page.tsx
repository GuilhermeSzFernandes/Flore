import { getReferrerByCode } from '@/actions/auth'
import RegistroForm from './RegistroForm'

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const refCode = ref?.toUpperCase().slice(0, 6) ?? ''

  let referrerName: string | undefined
  if (refCode.length === 6) {
    const referrer = await getReferrerByCode(refCode)
    if (referrer) {
      referrerName = referrer.businessName ?? referrer.displayName
    }
  }

  return <RegistroForm refCode={refCode} referrerName={referrerName} />
}
