import { Button, Detail, HStack } from '@navikt/ds-react'
import { useCallback, useEffect, useState } from 'react'

import { Fritekst } from '../../../../felleskomponenter/brev/Fritekst'
import { SkjemaAlert } from '../../../../felleskomponenter/SkjemaAlert'
import { Etikett } from '../../../../felleskomponenter/typografi'
import { post, postBrevutkast } from '../../../../io/http'
import {
  Barnebrillesak,
  Brevkode,
  BrevTekst,
  Brevtype,
  MålformType,
  OppgaveStatusType,
  StepType,
  VilkårsResultat,
} from '../../../../types/types.internal'
import { useBrevtekst } from '../../brevutkast/useBrevtekst'
import { useManuellSaksbehandlingContext } from '../../ManuellSaksbehandlingTabContext'
import { useSaksdokumenter } from '../../useSaksdokumenter'
import { useSamletVurdering } from '../../useSamletVurdering'
import { useBrev } from './brev/useBrev'
import { useDebounce } from '../../../../felleskomponenter/brev/useDebounce'

interface RedigeringsvisningProps {
  sak: Barnebrillesak
  mutate(...args: any[]): any
}

export function Redigeringsvisning(props: RedigeringsvisningProps) {
  const { sak, mutate } = props
  const { setStep } = useManuellSaksbehandlingContext()
  const [loading, setLoading] = useState(false)
  const samletVurdering = useSamletVurdering(sak)
  const [valideringsfeil, setValideringsfeil] = useState<string | undefined>(undefined)
  const { data } = useBrevtekst(sak.sakId, Brevtype.BARNEBRILLER_VEDTAK)
  const { data: utkastTilInnhenteOpplysningerBrev } = useBrevtekst(
    sak.sakId,
    Brevtype.BARNEBRILLER_INNHENTE_OPPLYSNINGER
  )
  const [lagrer, setLagrer] = useState(false)
  const [submitAttempt, setSubmitAttempt] = useState(false)
  const brevtekst = data?.data.brevtekst
  const [fritekst, setFritekst] = useState(brevtekst || '')
  const { hentForhåndsvisning } = useBrev()

  const { data: saksdokumenter } = useSaksdokumenter(
    sak.sakId,
    samletVurdering === VilkårsResultat.OPPLYSNINGER_MANGLER
  )

  const usendtUtkastTilInnhenteOpplysningerBrev =
    utkastTilInnhenteOpplysningerBrev?.data.brevtekst && utkastTilInnhenteOpplysningerBrev?.data.brevtekst !== ''
  const etterspørreOpplysningerBrev = saksdokumenter?.find(
    (saksdokument) => saksdokument.brevkode === Brevkode.INNHENTE_OPPLYSNINGER_BARNEBRILLER
  )

  const etterspørreOpplysningerBrevFinnes = etterspørreOpplysningerBrev !== undefined

  const manglerPåkrevdEtterspørreOpplysningerBrev =
    samletVurdering === VilkårsResultat.OPPLYSNINGER_MANGLER &&
    !etterspørreOpplysningerBrevFinnes &&
    sak.status === OppgaveStatusType.TILDELT_SAKSBEHANDLER

  const manglerPåkrevdUtbetalingsmottakerVedInnvilgelse =
    sak.vilkårsvurdering?.resultat === VilkårsResultat.JA && !sak.utbetalingsmottaker?.kontonummer

  const visFritekstFelt =
    samletVurdering === VilkårsResultat.OPPLYSNINGER_MANGLER && !manglerPåkrevdEtterspørreOpplysningerBrev

  useEffect(() => {
    if (brevtekst) {
      setFritekst(brevtekst)
    }
  }, [brevtekst])

  useEffect(() => {
    if (submitAttempt) {
      valider()
    }
  }, [fritekst, submitAttempt])

  const lagreUtkast = useCallback(
    async (tekst: string) => {
      setLagrer(true)
      await postBrevutkast(byggBrevPayload(tekst))
      setLagrer(false)
    },
    [sak.sakId, fritekst]
  )

  useDebounce(fritekst, lagreUtkast)

  function byggBrevPayload(tekst?: string): BrevTekst {
    return {
      sakId: sak.sakId,
      målform: sak?.vilkårsgrunnlag?.målform || MålformType.BOKMÅL,
      brevtype: Brevtype.BARNEBRILLER_VEDTAK,
      data: {
        brevtekst: tekst ? tekst : fritekst,
      },
    }
  }

  const valider = () => {
    if (fritekst === '') {
      setValideringsfeil('Du kan ikke sende brevet uten å ha lagt til tekst')
      return false
    } else {
      setValideringsfeil(undefined)
      return true
    }
  }

  const sendTilGodkjenning = () => {
    setLoading(true)
    post(`/api/sak/${sak.sakId}/kontroll`, {})
      .catch(() => {
        setLoading(false)
        // todo -> håndtere feil her
      })
      .then(() => {
        setLoading(false)
        mutate()
      })
  }

  return (
    <>
      {visFritekstFelt && (
        <>
          <Fritekst
            label="Beskriv hvilke opplysninger som mangler"
            beskrivelse="Vises i brevet som en del av begrunnelsen for avslaget"
            valideringsfeil={valideringsfeil}
            fritekst={fritekst}
            //onLagre={lagreUtkast}
            lagrer={lagrer}
            onTextChange={setFritekst}
          />
          <div>
            <Button
              loading={false}
              size="small"
              variant="secondary"
              onClick={() => {
                hentForhåndsvisning(sak.sakId, Brevtype.BARNEBRILLER_VEDTAK)
              }}
            >
              Forhåndsvis
            </Button>
          </div>
        </>
      )}
      {manglerPåkrevdEtterspørreOpplysningerBrev && (
        <SkjemaAlert variant="warning" role="status">
          <Etikett>Mangler innhente opplysninger brev</Etikett>
          <Detail>
            Det er ikke sendt ut brev for å innhente manglende opplysninger i denne saken. Du kan ikke avslå en sak på
            grunn av manglende opplysninger før det er sendt brev til bruker for å innhenter manglende opplysninger og
            bruker ikke har sendt inn dette før fristen på 3 uker.
          </Detail>
        </SkjemaAlert>
      )}

      {usendtUtkastTilInnhenteOpplysningerBrev && (
        <SkjemaAlert variant="warning">
          <Detail>
            Det er laget et brev i saken som ikke er sendt ut. Gå til brev-fanen for å sende eller slette brevet.
          </Detail>
        </SkjemaAlert>
      )}

      <HStack gap="2">
        <Button variant="secondary" size="small" onClick={() => setStep(StepType.VILKÅR)}>
          Forrige
        </Button>
        {!manglerPåkrevdEtterspørreOpplysningerBrev && !manglerPåkrevdUtbetalingsmottakerVedInnvilgelse && (
          <Button
            loading={loading}
            disabled={loading}
            size="small"
            variant="primary"
            onClick={() => {
              setSubmitAttempt(true)
              if (!visFritekstFelt || valider()) {
                sendTilGodkjenning()
              }
            }}
          >
            Send til godkjenning
          </Button>
        )}
      </HStack>
    </>
  )
}
