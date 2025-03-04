import { delay, http } from 'msw'

import { Brevtype, OppgaveStatusType } from '../../types/types.internal'
import type { StoreHandlersFactory } from '../data'
import { respondNoContent, respondPdf } from './response'
import type { SakParams } from './params'
import { lastDokumentBarnebriller } from '../data/felles'

interface BrevParams extends SakParams {
  brevtype: string
}

export const brevHandlers: StoreHandlersFactory = ({ barnebrillesakStore }) => [
  // dokumenter for saksbehandlers enhet hvor status != endelig journalført
  http.get<BrevParams>(`/api/sak/:sakId/brev/:brevtype`, async ({ params }) => {
    let buffer: ArrayBuffer
    if (params.brevtype === Brevtype.BARNEBRILLER_VEDTAK) {
      buffer = await lastDokumentBarnebriller('innvilgelsesbrev')
    } else {
      buffer = await lastDokumentBarnebriller('innhente_opplysninger')
    }
    await delay(1000)
    return respondPdf(buffer)
  }),

  http.post<SakParams>('/api/sak/:sakId/brevsending', async ({ params }) => {
    await barnebrillesakStore.lagreSaksdokument(params.sakId, 'Innhent opplysninger')
    await barnebrillesakStore.oppdaterStatus(params.sakId, OppgaveStatusType.AVVENTER_DOKUMENTASJON)
    await barnebrillesakStore.fjernBrevtekst(params.sakId)
    await delay(500)
    return respondNoContent()
  }),
]
