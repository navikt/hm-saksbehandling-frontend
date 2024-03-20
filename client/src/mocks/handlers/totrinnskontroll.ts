import { delay, http } from 'msw'

import type { TotrinnskontrollData } from '../../types/types.internal'
import type { StoreHandlersFactory } from '../data'
import { respondCreated, respondNoContent } from './response'
import type { SakParams } from './params'

export const totrinnskontrollHandlers: StoreHandlersFactory = ({ barnebrillesakStore }) => [
  http.post<SakParams>(`/api/sak/:sakId/kontroll`, async ({ params }) => {
    const sakId = params.sakId
    await barnebrillesakStore.sendTilGodkjenning(sakId)
    await delay(500)
    return respondCreated()
  }),

  http.put<SakParams, TotrinnskontrollData>(`/api/sak/:sakId/kontroll`, async ({ request, params }) => {
    const sakId = params.sakId
    const totrinnskontroll = await request.json()
    await barnebrillesakStore.ferdigstillTotrinnskontroll(sakId, totrinnskontroll)
    await delay(500)
    return respondNoContent()
  }),
]
