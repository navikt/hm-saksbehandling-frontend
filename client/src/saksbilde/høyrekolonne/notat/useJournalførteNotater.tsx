import useSwr from 'swr'
import type { JournalforingsnotatTeller } from '../../../types/types.internal'
import { useErNotatPilot } from '../../../state/authentication'

export function useJournalførteNotater(sakId?: string) {
  const erNotatPilot = useErNotatPilot()

  const {
    data: journalførteNotater,
    mutate,
    isLoading,
  } = useSwr<JournalforingsnotatTeller>(erNotatPilot && sakId ? `/api/sak/${sakId}/forvaltningsnotater` : null)
  return {
    journalførteNotater,
    isLoading,
    mutate,
  }
}
