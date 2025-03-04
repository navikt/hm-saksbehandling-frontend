import { useParams } from 'react-router'
import useSwr from 'swr'
import { httpGet } from '../../../io/http'
import { Bestilling } from '../../../types/types.internal'

interface BestillingResponse {
  bestilling: Bestilling | undefined
  mutate: () => void
}

export function useBestilling(): BestillingResponse {
  const { saksnummer: sakId } = useParams<{ saksnummer: string }>()
  const { data, mutate } = useSwr<{ data: Bestilling }>([`api/bestilling/${sakId}`], httpGet, {
    shouldRetryOnError: false,
  })

  return {
    bestilling: data?.data || undefined,
    mutate: mutate,
  }
}
