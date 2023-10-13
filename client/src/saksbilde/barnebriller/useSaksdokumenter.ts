import useSWR from 'swr'

import { Saksdokument, SaksdokumentType } from '../../types/types.internal'

export function useSaksdokumenter(sakId: string, shouldFetch = true) {
  const url = `/api/sak/${sakId}/dokumenter?type=${encodeURIComponent(SaksdokumentType.UTGÅENDE)}`
  const { data, isLoading } = useSWR<Saksdokument[]>(() => (shouldFetch ? url : null))

  return {
    data,
    isLoading,
  }
}
