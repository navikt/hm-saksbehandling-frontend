import { delay, http, HttpResponse } from 'msw'

import {
  Artikkel,
  OppgaveStatusType,
  StegType,
  TilgangResultat,
  TilgangType,
  VedtakPayload,
  VedtakStatusType,
} from '../../types/types.internal'
import type { StoreHandlersFactory } from '../data'
import {
  respondConflict,
  respondForbidden,
  respondInternalServerError,
  respondNoContent,
  respondNotFound,
  respondUnauthorized,
} from './response'
import type { SakParams } from './params'
import { hentJournalførteNotater } from '../data/journalførteNotater'

export const saksbehandlingHandlers: StoreHandlersFactory = ({
  sakStore,
  barnebrillesakStore,
  journalpostStore,
  saksbehandlerStore,
}) => [
  http.post<SakParams, { overtaHvisTildelt: boolean | undefined }>(
    `/api/sak/:sakId/tildeling`,
    async ({ params, request }) => {
      const { sakId } = params
      const overtaHvisTildelt = (await request.json()).overtaHvisTildelt
      await delay(500)
      if (sakId == '1008' && overtaHvisTildelt === false) {
        await sakStore.tildel(sakId, true)
        return respondConflict()
      }
      if (sakId == '1111' && overtaHvisTildelt === false) {
        await barnebrillesakStore.tildel(sakId, true)
        return respondConflict()
      }
      if (await sakStore.tildel(sakId)) {
        return respondNoContent()
      }
      if (await barnebrillesakStore.tildel(sakId)) {
        return respondNoContent()
      }
      return respondNotFound()
    }
  ),

  http.delete<SakParams>(`/api/sak/:sakId/tildeling`, async ({ params }) => {
    const { sakId } = params
    if (await sakStore.frigi(sakId)) {
      return respondNoContent()
    }
    if (await barnebrillesakStore.frigi(sakId)) {
      return respondNoContent()
    }
    return respondNotFound()
  }),

  http.get<SakParams>(`/api/sak/:sakId`, async ({ params }) => {
    const { sakId } = params
    if (sakId === '401') {
      return respondUnauthorized()
    }
    if (sakId === '403') {
      return respondForbidden()
    }
    if (sakId === '500') {
      return respondInternalServerError()
    }

    await delay(500)

    const sak = await sakStore.hent(sakId)
    let { navn: bruker } = await saksbehandlerStore.innloggetSaksbehandler()
    const harSkrivetilgang = bruker !== 'Les Visningrud'

    const tilganger = {
      [TilgangType.KAN_BEHANDLE_SAK]: harSkrivetilgang ? TilgangResultat.TILLAT : TilgangResultat.NEKT,
    }

    if (sak) {
      return HttpResponse.json({
        kanTildeles: sak.status === OppgaveStatusType.AVVENTER_SAKSBEHANDLER,

        data: sak,
        tilganger,
      })
    }

    const barnebrillesak = await barnebrillesakStore.hent(sakId)
    if (barnebrillesak) {
      return HttpResponse.json({
        tilganger,
        kanTildeles:
          barnebrillesak.status === OppgaveStatusType.AVVENTER_SAKSBEHANDLER ||
          barnebrillesak.status === OppgaveStatusType.AVVENTER_GODKJENNER,
        data: barnebrillesak,
      })
    }

    return respondNotFound()
  }),

  http.get<SakParams>(`/api/sak/:sakId/historikk`, async ({ params }) => {
    const { sakId } = params
    const hendelser = await Promise.all([sakStore.hentHendelser(sakId), barnebrillesakStore.hentHendelser(sakId)])
    await delay(500)
    return HttpResponse.json(hendelser.flat())
  }),

  http.get<SakParams>(`/api/sak/:sakId/dokumenter`, async ({ request, params }) => {
    const { sakId } = params
    const url = new URL(request.url)
    const dokumentType = url.searchParams.get('type')

    if (dokumentType == 'NOTAT') {
      await delay(500)
      return HttpResponse.json(hentJournalførteNotater(sakId))
    }

    // Hvis ingen type er angitt som query param, bruker gammel oppførsel som henter journalposter fra sak.
    // Ligger her for å bevare bakoverkompabilitet
    // På sikt skal vi vekk fra dette og heller hente innkommende journalposter fra sak hentet fra joark.
    if (!dokumentType) {
      const sak = await barnebrillesakStore.hent(sakId)
      if (!sak) {
        return respondNotFound()
      }

      const journalposter = sak.journalposter
      const dokumenter = await Promise.all(
        journalposter.map(async (journalpostId) => {
          const journalpostDokument = await journalpostStore.hent(journalpostId)
          if (journalpostDokument) {
            return journalpostDokument.dokumenter
          }
        })
      )

      return HttpResponse.json(dokumenter.flat())
    } else {
      const saksdokumenter = await barnebrillesakStore.hentSaksdokumenter(sakId) // dokumentType
      return HttpResponse.json(saksdokumenter)
    }
  }),

  http.put<SakParams, VedtakPayload>('/api/sak/:sakId/vedtak', async ({ params }) => {
    const sakId = params.sakId
    await sakStore.fattVedtak(sakId, OppgaveStatusType.VEDTAK_FATTET, VedtakStatusType.INNVILGET)
    return respondNoContent()
  }),

  http.put<SakParams>('/api/sak/:sakId/tilbakeforing', async ({ params }) => {
    const sakId = params.sakId
    await sakStore.oppdaterStatus(sakId, OppgaveStatusType.SENDT_GOSYS)
    return respondNoContent()
  }),

  http.post<SakParams>('/api/sak/:sakId/informasjon-om-hjelpemiddel', async () => {
    return respondNoContent()
  }),

  http.put<SakParams, { status: OppgaveStatusType }>('/api/sak/:sakId/status', async ({ request, params }) => {
    const sakId = params.sakId
    const { status } = await request.json()
    await barnebrillesakStore.oppdaterStatus(sakId, status)
    await barnebrillesakStore.lagreHendelse(sakId, 'Fortsetter behandling av sak')
    return respondNoContent()
  }),

  http.post<SakParams>('/api/sak/:sakId/vilkarsvurdering', async ({ params }) => {
    await barnebrillesakStore.oppdaterSteg(params.sakId, StegType.FATTE_VEDTAK)
    return respondNoContent()
  }),

  http.get<SakParams, never, Artikkel[]>('/api/sak/:sakId/artikler', async ({ params }) => {
    const sak = await sakStore.hent(params.sakId)

    if (!sak) {
      return respondNotFound() as any // fixme
    }

    // TODO Fiks her, hent fra behovsmelding i stedet?
    //const artikler: Artikkel[] = sak?.hjelpemidler
    //.map((hjelpemiddel) => {
    // TODO: Fix dette når behovsmeldingstore er på plass
    //const artikkel: Artikkel = {
    //hmsnr: hjelpemiddel.hmsnr,
    //navn: 'navn' /*hjelpemiddel.beskrivelse*/,
    //antall: 69 /*hjelpemiddel.antall*/,
    //finnesIOebs: hjelpemiddel.hmsnr === '289689' ? false : true,
    //}
    /* const tilbehørArtikler: Artikkel[] = hjelpemiddel.tilbehør.map((tilbehør) => {
          return { hmsnr: tilbehør.hmsNr, navn: tilbehør.navn, antall: tilbehør.antall, finnesIOebs: true }
        })*/
    //return [/*artikkel *//*, ...tilbehørArtikler*/]
    //})
    //.flat()

    return HttpResponse.json([])
  }),

  http.post<SakParams, { foo: string }>('/api/sak/:sakId/henleggelse', async ({ params }) => {
    await sakStore.oppdaterStatus(params.sakId, OppgaveStatusType.HENLAGT)
    return respondNoContent()
  }),
]
