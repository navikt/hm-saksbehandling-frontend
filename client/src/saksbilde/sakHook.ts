import { useParams } from 'react-router'
import useSwr from 'swr'

import { httpGet } from '../io/http'

import { Brillesak, Sak } from '../types/types.internal'

interface DataResponse {
  sak: Sak | undefined
  isLoading: boolean
  isError: any
}

interface BrillesakResponse {
  sak: Brillesak | undefined
  isLoading: boolean
  isError: any
}

export function useSak(): DataResponse {
  const { saksnummer } = useParams<{ saksnummer: string }>()
  const { data, error } = useSwr<{ data: Sak }>(`api/sak/${saksnummer}`, httpGet, { refreshInterval: 10000 })

  return {
    sak: data?.data,
    isLoading: !error && !data,
    isError: error,
  }
}

// Duplisert frem til vi vet om de ulike sakstypene vil ha samme payload eller om det blir to ulike varianter/endepunkt
export function useBrillesak(): BrillesakResponse {
  const { saksnummer } = useParams<{ saksnummer: string }>()
  const { data, error } = useSwr<{ data: Brillesak }>(`api/sak/${saksnummer}`, httpGet, { refreshInterval: 10000 })

  return {
    sak: data?.data,
    isLoading: !error && !data,
    isError: error,
  }
}
