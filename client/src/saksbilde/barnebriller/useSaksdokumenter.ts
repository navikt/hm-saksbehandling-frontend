import useSWR from 'swr'

import { Saksdokument, SaksdokumentType } from '../../types/types.internal'

export function useSaksdokumenter(sakId: string, shouldFetch = true, sakstype = SaksdokumentType.UTGÅENDE, opts?: any) {
  const url = `/api/sak/${sakId}/dokumenter?type=${encodeURIComponent(sakstype)}`
  const { data = [], error, mutate, isLoading } = useSWR<Saksdokument[]>(() => (shouldFetch ? url : null), opts)
  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
