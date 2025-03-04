import { delay, http, HttpResponse } from 'msw'

import type { Notat } from '../../types/types.internal'
import type { StoreHandlersFactory } from '../data'
import { respondCreated, respondNoContent } from './response'
import type { SakParams } from './params'
import { hentJournalførteNotater } from '../data/journalførteNotater'

type NyttNotat = Pick<Notat, 'type' | 'innhold'>

interface NotatParams extends SakParams {
  notatId: string
}

export const notatHandlers: StoreHandlersFactory = ({ barnebrillesakStore }) => [
  http.post<SakParams, NyttNotat>(`/api/sak/:sakId/notater`, async ({ request, params }) => {
    const { type, innhold } = await request.json()
    await barnebrillesakStore.lagreNotat(params.sakId, type, innhold)
    await delay(500)
    return respondCreated()
  }),

  http.get<SakParams>(`/api/sak/:sakId/notater`, async ({ params }) => {
    const notater = await barnebrillesakStore.hentNotater(params.sakId)
    await delay(500)
    return HttpResponse.json(notater)
  }),

  http.get<SakParams>(`/api/sak/:sakId/forvaltningsnotater`, async ({ params }) => {
    const harUtkast = !!(await barnebrillesakStore.hentBrevtekst(params.sakId))
    const antallNotater = hentJournalførteNotater(params.sakId).length + (harUtkast ? 1 : 0)

    return HttpResponse.json({ antallNotater, harUtkast })
  }),

  http.delete<NotatParams>(`/api/sak/:sakId/notater/:notatId`, async ({ params }) => {
    await barnebrillesakStore.slettNotat(Number(params.notatId))
    await delay(100)
    return respondNoContent()
  }),
]
