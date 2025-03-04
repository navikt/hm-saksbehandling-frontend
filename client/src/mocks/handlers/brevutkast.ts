import { delay, http, HttpResponse } from 'msw'

import type { BrevTekst, Brevtype } from '../../types/types.internal'
import type { StoreHandlersFactory } from '../data'
import { respondNoContent } from './response'
import type { SakParams } from './params'

type NyBrevtekst = Pick<BrevTekst, 'brevtype' | 'data'>

interface BrevutkastParams extends SakParams {
  brevtype: Brevtype
}

export const brevutkastHandlers: StoreHandlersFactory = ({ barnebrillesakStore }) => [
  http.post<SakParams, NyBrevtekst>(`/api/sak/:sakId/brevutkast`, async ({ request, params }) => {
    const { brevtype, data } = await request.json()
    await barnebrillesakStore.lagreBrevtekst(params.sakId, brevtype, data)
    await delay(1000)
    return respondNoContent()
  }),

  http.delete<BrevutkastParams>(`/api/sak/:sakId/brevutkast/:brevtype`, async ({ params }) => {
    await barnebrillesakStore.fjernBrevtekst(params.sakId)
    await delay(500)
    return respondNoContent()
  }),

  http.get<BrevutkastParams>(`/api/sak/:sakId/brevutkast/:brevtype`, async ({ params }) => {
    const brevTekst = await barnebrillesakStore.hentBrevtekst(params.sakId)
    await delay(800)
    if (brevTekst) {
      return HttpResponse.json(brevTekst)
    } else {
      return HttpResponse.json({ sakId: params.sakId, brevtype: '', data: { brevtekst: '' } })
    }
  }),
]
