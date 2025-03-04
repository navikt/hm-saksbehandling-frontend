import { TrashIcon } from '@navikt/aksel-icons'
import { Button, Heading, HStack, Radio, RadioGroup, Select, Skeleton, VStack } from '@navikt/ds-react'
import { memo, useCallback, useEffect, useState } from 'react'

import { Fritekst } from '../../../felleskomponenter/brev/Fritekst'
import { InfoToast } from '../../../felleskomponenter/Toast'
import { Brødtekst } from '../../../felleskomponenter/typografi'
import { deleteBrevutkast, postBrevutkast, postBrevutsending } from '../../../io/http'
import { BrevTekst, Brevtype, MålformType } from '../../../types/types.internal'
import { useBrevtekst } from '../../barnebriller/brevutkast/useBrevtekst'
import { useBrev } from '../../barnebriller/steg/vedtak/brev/useBrev'
import { useSaksdokumenter } from '../../barnebriller/useSaksdokumenter'
import { BekreftelseModal } from '../../komponenter/BekreftelseModal'
import { useBarnebrillesak } from '../../useBarnebrillesak'
import { HøyrekolonnePanel } from '../HøyrekolonnePanel.tsx'
import { ForhåndsvisningsModal } from './ForhåndsvisningModal'
import { UtgåendeBrev } from './UtgåendeBrev'
import { useDebounce } from '../../../felleskomponenter/brev/useDebounce.ts'

export interface SendBrevProps {
  sakId: string
  lesevisning: boolean
}

export const SendBrevPanel = memo((props: SendBrevProps) => {
  const { sakId, lesevisning } = props
  const { data, mutate: hentBrevtekst } = useBrevtekst(sakId, Brevtype.BARNEBRILLER_INNHENTE_OPPLYSNINGER)
  const brevtekst = data?.data.brevtekst
  const [lagrer, setLagrer] = useState(false)
  const [sletter, setSletter] = useState(false)
  const [senderBrev, setSenderBrev] = useState(false)
  const [visSendBrevModal, setVisSendBrevModal] = useState(false)
  const [visForhåndsvisningsmodal, setVisForhåndsvisningsmodal] = useState(false)
  const [visSlettUtkastModal, setVisSlettUtkastModal] = useState(false)
  const [målform, setMålform] = useState(MålformType.BOKMÅL)
  const [fritekst, setFritekst] = useState(brevtekst || '')
  const [submitAttempt, setSubmitAttempt] = useState(false)
  const [visSendtBrevToast, setVisSendtBrevToast] = useState(false)
  const [visSlettetUtkastToast, setVisSlettetUtkastToast] = useState(false)
  const [valideringsfeil, setValideringsfeil] = useState<string | undefined>(undefined)
  const { mutate: hentBarnebrillesak } = useBarnebrillesak()
  const { mutate: hentSaksdokumenter } = useSaksdokumenter(sakId)
  const { hentForhåndsvisning } = useBrev()
  const brevtype = Brevtype.BARNEBRILLER_INNHENTE_OPPLYSNINGER

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
    async (tekst: string, valgtMålform?: MålformType) => {
      setLagrer(true)
      await postBrevutkast(byggBrevPayload(tekst, valgtMålform))
      setTimeout(() => {
        setLagrer(false)
      }, 500)
    },
    [sakId, målform, fritekst]
  )

  useDebounce(fritekst, lagreUtkast)

  const valider = () => {
    if (fritekst === '') {
      setValideringsfeil('Du kan ikke sende brevet uten å ha lagt til tekst')
      return false
    } else {
      setValideringsfeil(undefined)
      return true
    }
  }

  if (!data) {
    return (
      <HøyrekolonnePanel tittel="Send brev">
        <Heading level="2" as={Skeleton} size="small" spacing>
          Placeholder
        </Heading>
        <VStack gap="4">
          <Skeleton variant="rectangle" width="80%" height={30} />
          <Skeleton variant="rectangle" width="80%" height={90} />
        </VStack>
      </HøyrekolonnePanel>
    )
  }

  function byggBrevPayload(tekst?: string, valgtMålform?: MålformType): BrevTekst {
    return {
      sakId: sakId,
      målform: valgtMålform || målform,
      brevtype,
      data: {
        brevtekst: tekst != undefined ? tekst : fritekst,
      },
    }
  }

  const sendBrev = async () => {
    setSenderBrev(true)
    await postBrevutsending(byggBrevPayload())

    setSenderBrev(false)
    setVisSendBrevModal(false)
    setSubmitAttempt(false)
    setFritekst('')
    setVisSendtBrevToast(true)
    hentBarnebrillesak()
    await hentSaksdokumenter()

    setTimeout(() => {
      setVisSendtBrevToast(false)
      hentBarnebrillesak()
      hentSaksdokumenter()
    }, 3000)
  }

  const slettUtkast = async () => {
    setSletter(true)
    await deleteBrevutkast(sakId, Brevtype.BARNEBRILLER_INNHENTE_OPPLYSNINGER)
    setFritekst('')
    setVisSlettUtkastModal(false)
    setVisSlettetUtkastToast(true)
    setTimeout(() => {
      setVisSlettetUtkastToast(false)
    }, 3000)
    await hentBrevtekst()
    setSletter(false)
  }

  return (
    <>
      <>
        <HøyrekolonnePanel tittel="Send brev">
          {lesevisning ? (
            <Brødtekst>Saken må være under behandling og du må være tildelt saken for å kunne sende brev.</Brødtekst>
          ) : (
            <form onSubmit={(e) => e.preventDefault()}>
              <VStack gap="4">
                <Select size="small" label="Velg brevmal">
                  <option value={brevtype}>Innhente opplysninger</option>
                </Select>
                <RadioGroup
                  legend="Målform"
                  size="small"
                  value={målform}
                  onChange={(value: MålformType) => {
                    setMålform(value)
                    return lagreUtkast(fritekst, value)
                  }}
                >
                  <Radio value={MålformType.BOKMÅL}>Bokmål</Radio>
                  <Radio value={MålformType.NYNORSK}>Nynorsk</Radio>
                </RadioGroup>
                <Fritekst
                  label="Fritekst"
                  beskrivelse="Beskriv hva som mangler av dokumentasjon"
                  fritekst={fritekst}
                  valideringsfeil={valideringsfeil}
                  lagrer={lagrer}
                  onTextChange={setFritekst}
                />
              </VStack>
              <HStack gap="2">
                <Button
                  type="submit"
                  size="small"
                  variant="tertiary"
                  onClick={() => {
                    hentForhåndsvisning(sakId, brevtype)
                    setVisForhåndsvisningsmodal(true)
                  }}
                >
                  Forhåndsvis
                </Button>
                <Button
                  type="submit"
                  size="small"
                  variant="primary"
                  onClick={() => {
                    setSubmitAttempt(true)
                    if (valider()) {
                      setVisSendBrevModal(true)
                    }
                  }}
                >
                  Send brev
                </Button>
                <Button
                  icon={<TrashIcon />}
                  variant="danger"
                  size="small"
                  onClick={() => {
                    setVisSlettUtkastModal(true)
                  }}
                />
              </HStack>
            </form>
          )}
        </HøyrekolonnePanel>
        <UtgåendeBrev sakId={sakId} />
      </>
      <ForhåndsvisningsModal
        open={visForhåndsvisningsmodal}
        sakId={sakId}
        brevtype={brevtype}
        onClose={() => {
          setVisForhåndsvisningsmodal(false)
        }}
      />
      <BekreftelseModal
        heading="Vil du sende brevet?"
        buttonLabel="Send brev"
        open={visSendBrevModal}
        loading={senderBrev}
        onClose={() => setVisSendBrevModal(false)}
        onBekreft={() => {
          return sendBrev()
        }}
      >
        <Brødtekst>Brevet sendes til adressen til barnet, og saken settes på vent.</Brødtekst>
      </BekreftelseModal>
      <BekreftelseModal
        heading="Vil du slette utkastet?"
        buttonLabel="Slett utkast"
        buttonVariant="danger"
        open={visSlettUtkastModal}
        loading={sletter}
        onClose={() => setVisSlettUtkastModal(false)}
        onBekreft={() => {
          return slettUtkast()
        }}
      />
      {visSendtBrevToast && (
        <InfoToast bottomPosition="300px">
          Brevet er sendt. Det kan ta litt tid før det dukker opp i listen over.
        </InfoToast>
      )}
      {visSlettetUtkastToast && <InfoToast bottomPosition="400px">Utkast slettet</InfoToast>}
    </>
  )
})
