import { listsPlugin, MDXEditor, quotePlugin, thematicBreakPlugin } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { ExternalLinkIcon, TrashIcon } from '@navikt/aksel-icons'
import {
  BodyShort,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  ErrorMessage,
  Heading,
  HStack,
  Label,
  Link,
  Loader,
  ReadMore,
  Skeleton,
  TextField,
  Tooltip,
  VStack,
} from '@navikt/ds-react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { InfoToast } from '../../felleskomponenter/Toast.tsx'
import { BrytbarBrødtekst, Brødtekst, Mellomtittel, Tekst, Undertittel } from '../../felleskomponenter/typografi.tsx'
import { deleteBrevutkast, postBrevutkast, postBrevutsending } from '../../io/http.ts'
import { Brevtype, MålformType, Sak, Saksdokument, SaksdokumentType } from '../../types/types.internal.ts'
import { formaterTidsstempel } from '../../utils/dato.ts'
import { useBrevtekst } from '../barnebriller/brevutkast/useBrevtekst.ts'
import { useBrev } from '../barnebriller/steg/vedtak/brev/useBrev.ts'
import { useSaksdokumenter } from '../barnebriller/useSaksdokumenter.ts'
import { ForhåndsvisningsModal } from '../høyrekolonne/brevutsending/ForhåndsvisningModal.tsx'
import { BekreftelseModal } from '../komponenter/BekreftelseModal.tsx'
import { MarkdownEditor } from './MarkdownEditor.tsx'
//import { useJournalførteNotater } from '../høyrekolonne/notat/useJournalførteNotater.tsx'

export interface JournalførteNotaterProps {
  sak: Sak
  lesevisning: boolean
}

export function JournalførteNotater({ sak, lesevisning }: JournalførteNotaterProps) {
  const [lagrerUtkast, setLagrerUtkast] = useState(false)
  const [sletter, setSletter] = useState(false)
  //const { journalførteNotater: notatTeller, mutate: oppdaterNotatTeller } = useJournalførteNotater(sak.sakId)
  const [journalførerNotat, setJournalførerNotat] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | undefined>(undefined)
  const [visSlettUtkastModal, setVisSlettUtkastModal] = useState(false)
  const [visSlettetUtkastToast, setVisSlettetUtkastToast] = useState(false)
  const [visNotatJournalførtToast, setVisNotatJournalførtToast] = useState(false)
  const [visForhåndsvisningsmodal, setVisForhåndsvisningsmodal] = useState(false)
  const [visLasterNotat, setVisLasterNotat] = useState<Saksdokument[] | null>(null)
  const { hentForhåndsvisning } = useBrev()
  const [submitAttempt, setSubmitAttempt] = useState(false)
  const [valideringsfeil, setValideringsfeil] = useState<NotatValideringError>({})
  const [klarForFerdigstilling, setKlarForFerdigstilling] = useState(false)

  const brevtype = Brevtype.JOURNALFØRT_NOTAT

  const {
    data: utkast,
    isLoading: utkastLasterInn,
    mutate: utkastMutert,
  } = useBrevtekst(sak.sakId, Brevtype.JOURNALFØRT_NOTAT)

  const {
    data: journalførteNotater,
    isLoading: journalførteNotaterLaster,
    mutate: journalførteNotaterMutert,
  } = useSaksdokumenter(
    sak.sakId,
    true,
    SaksdokumentType.NOTAT,
    visLasterNotat != null ? { refreshInterval: 2000 } : null
  )

  useEffect(() => {
    if (submitAttempt) {
      valider()
    }
  }, [klarForFerdigstilling, utkast?.data.dokumenttittel, utkast?.data.brevtekst, submitAttempt])

  useEffect(() => {
    if (visLasterNotat != null && visLasterNotat.length != journalførteNotater.length) {
      setVisLasterNotat(null)
    }
  }, [journalførteNotater])

  const dokumenttittelEndret = (dokumenttittel: string) => {
    if (utkast) {
      utkastEndret(dokumenttittel, utkast.data.brevtekst || '')
    }
  }

  function valider() {
    let valideringsfeil: NotatValideringError = {}

    if (!klarForFerdigstilling) {
      valideringsfeil.bekreftSynlighet = 'Du må bekrefte at dokumentet kan bli synlig for bruker'
    }

    if (!utkast?.data.dokumenttittel || utkast.data.dokumenttittel.length == 0) {
      valideringsfeil.tittel = 'Du må skrive en tittel'
    }

    if (!utkast?.data.brevtekst || utkast.data.brevtekst.length == 0) {
      valideringsfeil.tekst = 'Du må skrive en tekst'
    }

    setValideringsfeil(valideringsfeil)
    return Object.keys(valideringsfeil).length == 0
  }

  const markdownEndret = (markdown: string) => {
    if (utkast) {
      utkastEndret(utkast.data.dokumenttittel || '', markdown)
    }
  }

  const lagPayload = (tittel: string, tekst: string) => {
    return {
      sakId: sak.sakId,
      målform: MålformType.BOKMÅL,
      brevtype: Brevtype.JOURNALFØRT_NOTAT,
      data: {
        dokumenttittel: tittel,
        brevtekst: tekst,
      },
    }
  }

  // Vent på at bruker endrer på utkastet, debounce repeterte endringer i 500ms, lagre utkastet og muter swr state, vis melding
  // om at vi lagrer utkastet i minimum 1s slik at bruker rekker å lese det.
  const utkastEndret = async (tittel: string, markdown: string) => {
    // Lokal oppdatering for liveness
    await utkastMutert(lagPayload(tittel, markdown), { revalidate: false })

    if (debounceTimer) clearTimeout(debounceTimer)
    setDebounceTimer(
      setTimeout(async () => {
        setLagrerUtkast(true)

        const payload = lagPayload(tittel, markdown)
        const minimumPeriodeVisLagrerUtkast = new Promise((r) => setTimeout(r, 1000))
        await postBrevutkast(payload)
        await minimumPeriodeVisLagrerUtkast
        setLagrerUtkast(false)

        /*if (!notatTeller?.harUtkast) {
          oppdaterNotatTeller()
        }*/
      }, 500)
    )
  }

  const journalførNotat = async () => {
    setJournalførerNotat(true)
    setVisLasterNotat([...journalførteNotater]) // Må settes før posting av brevsending pga. race
    await postBrevutsending(lagPayload(utkast!.data!.dokumenttittel!, utkast!.data!.brevtekst!))
    await utkastMutert(lagPayload('', ''))
    setValideringsfeil({})
    setSubmitAttempt(false)
    await journalførteNotaterMutert()

    setKlarForFerdigstilling(false)
    setVisNotatJournalførtToast(true)
    setJournalførerNotat(false)
    //oppdaterNotatTeller()
    setTimeout(() => setVisNotatJournalførtToast(false), 3000)
  }

  const slettUtkast = async () => {
    setSletter(true)
    await deleteBrevutkast(sak.sakId, Brevtype.JOURNALFØRT_NOTAT)
    setVisSlettUtkastModal(false)
    setVisSlettetUtkastToast(true)

    setTimeout(() => {
      setVisSlettetUtkastToast(false)
    }, 5000)
    await utkastMutert(lagPayload('', ''), { revalidate: false })
    setSubmitAttempt(false)
    setValideringsfeil({})
    setKlarForFerdigstilling(false)
    setSletter(false)
    //oppdaterNotatTeller()
  }

  const readOnly = lesevisning || journalførerNotat

  return (
    <>
      <VStack gap="2">
        <Brødtekst>
          Opplysninger som er relevante for saksbehandlingen skal journalføres og knyttes til saken.
        </Brødtekst>
        <ReadMore size="small" header="Dette må du vite om journalførte notater">
          <BrytbarBrødtekst>
            Hvis du har mottatt saksopplysninger som er relevant for saksbehandlingen så skal disse journalføres på
            saken. Du kan her bearbeide ditt utkast, og vi lagrer det fortløpende. Men merk at det vil journalføres og
            bli tilgjengelig for bruker når du er ferdig og klikker "Journalfør notat" for å journalføre.
          </BrytbarBrødtekst>
        </ReadMore>
      </VStack>
      {utkastLasterInn && (
        <div>
          <Loader size="large" style={{ margin: '2em auto', display: 'block' }} />
        </div>
      )}
      {!utkastLasterInn && utkast && (
        <VStack gap="4" paddingBlock="8 0">
          <TextField
            size="small"
            label="Tittel"
            error={valideringsfeil.tittel}
            readOnly={readOnly}
            value={utkast.data.dokumenttittel || ''}
            onChange={(e) => dokumenttittelEndret(e.target.value)}
          />
          <div>
            <Label size="small">Tekst</Label>
            <MdxEditorStyling>
              <Box
                background="surface-default"
                marginBlock="0 0"
                borderRadius="medium"
                borderColor="border-default"
                borderWidth="1"
                className="mdxEditorBox"
              >
                <>
                  <MarkdownEditor tekst={utkast.data?.brevtekst || ''} onChange={markdownEndret} readOnly={readOnly} />
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        color: 'gray',
                        position: 'absolute',
                        right: '0.5em',
                        top: '-1.5em',
                        display: lagrerUtkast ? 'block' : 'none',
                      }}
                    >
                      <HStack gap="2">
                        <Loader size="small" title="Lagrer..." />
                        <BodyShort size="small">Lagrer utkast</BodyShort>
                      </HStack>
                    </div>
                  </div>
                </>
              </Box>
            </MdxEditorStyling>
            {valideringsfeil.tekst && (
              <ErrorMessage showIcon size="small">
                {valideringsfeil.tekst}
              </ErrorMessage>
            )}
          </div>
        </VStack>
      )}

      {!lesevisning && (
        <HStack justify="space-between" paddingBlock={'1-alt 0'}>
          <Button
            type="submit"
            size="xsmall"
            variant="tertiary"
            onClick={() => {
              hentForhåndsvisning(sak.sakId, brevtype)
              setVisForhåndsvisningsmodal(true)
            }}
          >
            Forhåndsvis dokument
          </Button>
          <Button
            icon={<TrashIcon />}
            variant="tertiary"
            size="xsmall"
            onClick={() => {
              setVisSlettUtkastModal(true)
            }}
          >
            Slett utkast
          </Button>
        </HStack>
      )}

      {!lesevisning && (
        <VStack gap="4" paddingBlock={'3 0'}>
          <CheckboxGroup
            size="small"
            hideLegend={true}
            value={klarForFerdigstilling ? ['bekreft'] : []}
            legend="Bekreft synlighet"
            error={valideringsfeil.bekreftSynlighet}
          >
            <Checkbox
              value="bekreft"
              size="small"
              error={!!valideringsfeil.bekreftSynlighet}
              onChange={(e) => setKlarForFerdigstilling(e.target.checked)}
            >
              Jeg er klar over at notatet blir synlig for bruker på nav.no neste virkedag
            </Checkbox>
          </CheckboxGroup>
          <div>
            <Button
              variant="secondary"
              size="small"
              loading={journalførerNotat}
              onClick={() => {
                setSubmitAttempt(true)
                if (valider()) {
                  journalførNotat()
                }
              }}
            >
              Journalfør notat
            </Button>
          </div>
        </VStack>
      )}

      <VStack gap="4" paddingBlock="8 0">
        <Mellomtittel spacing={false}>Notater knyttet til saken</Mellomtittel>
        {journalførteNotaterLaster && (
          <div>
            <Loader size="large" style={{ margin: '2em auto', display: 'block' }} />
          </div>
        )}
        {!journalførteNotaterLaster && journalførteNotater && (
          <>
            {!visLasterNotat && journalførteNotater.length === 0 && <Tekst>Ingen notater er knyttet til saken</Tekst>}
            {visLasterNotat && (
              <Box key="laster-notat" background="surface-subtle" padding="2" borderRadius="xlarge">
                <Heading as={Skeleton} size="large">
                  Card-title
                </Heading>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
              </Box>
            )}
            {[...journalførteNotater]
              .sort((a, b) => (a.opprettet < b.opprettet ? 1 : a.opprettet > b.opprettet ? -1 : 0))
              .map((notat) => {
                return (
                  <Box
                    key={`${notat.journalpostId}-${notat.dokumentId}`}
                    background="surface-subtle"
                    padding="2"
                    borderRadius="xlarge"
                  >
                    <HStack gap="2">
                      <VStack gap="2">
                        <HStack gap="2">
                          <Heading level="3" size="xsmall" style={{ fontSize: '1em' }}>
                            {notat.originalTekst?.dokumenttittel || notat.tittel}
                          </Heading>
                          <Tooltip content="Åpne i ny fane">
                            <Link href={`/api/journalpost/${notat.journalpostId}/${notat.dokumentId}`} target="_blank">
                              <ExternalLinkIcon />
                            </Link>
                          </Tooltip>
                        </HStack>
                        <VStack>
                          <Brødtekst>{formaterTidsstempel(notat.opprettet)}</Brødtekst>
                          <Undertittel>{notat.saksbehandler.navn}</Undertittel>
                        </VStack>
                      </VStack>
                    </HStack>
                    <MdxPreviewStyling>
                      {notat.originalTekst && (
                        <MDXEditor
                          markdown={notat.originalTekst.brevtekst}
                          readOnly={true}
                          contentEditableClassName="mdxEditorRemoveMargin"
                          plugins={[listsPlugin(), quotePlugin(), thematicBreakPlugin()]}
                        />
                      )}
                    </MdxPreviewStyling>
                    {!notat.originalTekst && (
                      <Box paddingBlock={'2 0'}>
                        <Brødtekst>
                          Dette notatet ble sendt inn igjennom Gosys, les PDF filen for å se innholdet.
                        </Brødtekst>
                      </Box>
                    )}
                  </Box>
                )
              })}
          </>
        )}
      </VStack>
      {visNotatJournalførtToast && (
        <InfoToast bottomPosition="10px">
          Notatet er journalført. Det kan ta litt tid før det dukker opp i listen over.
        </InfoToast>
      )}
      {visSlettetUtkastToast && <InfoToast bottomPosition="10px">Utkast slettet</InfoToast>}

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

      <ForhåndsvisningsModal
        open={visForhåndsvisningsmodal}
        sakId={sak.sakId}
        brevtype={brevtype}
        onClose={() => {
          setVisForhåndsvisningsmodal(false)
        }}
      />
    </>
  )
}

const MdxEditorStyling = styled.div`
  margin-bottom: 0.5rem;
  .mdxEditorBox:has([contenteditable='true']:focus) {
    border: 4px solid rgba(0, 52, 125, 1);
    margin: -3px;
  }
`

const MdxPreviewStyling = styled.div`
  .mdxEditorRemoveMargin {
    padding: 0;
    font-size: var(--a-font-size-medium);
    color: var(--a-text-default);
    font-family: 'Source Sans Pro';
  }
`
type NotatValideringError = {
  [key in 'tittel' | 'tekst' | 'bekreftSynlighet']?: string
}
