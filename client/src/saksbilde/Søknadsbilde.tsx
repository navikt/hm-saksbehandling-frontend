import { HGrid } from '@navikt/ds-react'
import { memo, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Route, Routes } from 'react-router-dom'

import styled from 'styled-components'
import { AlertError } from '../feilsider/AlertError'
import {
  hotsakHistorikkMaxWidth,
  hotsakHistorikkMinWidth,
  hotsakVenstremenyWidth,
  hovedInnholdMaxWidth,
} from '../GlobalStyles'
import { Sakstype } from '../types/types.internal'
import { formaterAdresse } from '../utils/formater'
import { BestillingCard } from './bestillingsordning/BestillingCard'
import { Saksvarsler } from './bestillingsordning/Saksvarsler'
import { Bruker } from './bruker/Bruker'
import { Formidler } from './formidler/Formidler'
import { HjelpemiddelListeNyLayout } from './hjelpemidler/HjelpemiddelListe'
import { useHjelpemiddeloversikt } from './høyrekolonne/hjelpemiddeloversikt/useHjelpemiddeloversikt'
import { Høyrekolonne } from './høyrekolonne/Høyrekolonne'
import { Hovedinnhold, Saksinnhold } from './komponenter/Sakskomponenter'
import { SakLoader } from './SakLoader'
import { Søknadslinje } from './Søknadslinje'
import { useBehovsmelding } from './useBehovsmelding'
import { useSak } from './useSak'
import { useSøknadsVarsler } from './varsler/useVarsler'
import { FormidlerCard } from './venstremeny/FormidlerCard'
import { GreitÅViteCard } from './venstremeny/GreitÅViteCard'
import { LeveringCard } from './venstremeny/LeveringCard'
import { SøknadCard } from './venstremeny/SøknadCard'
import { VedtakCard } from './venstremeny/VedtakCard'
import { Venstremeny } from './venstremeny/Venstremeny'
import { useSaksbehandlerHarSkrivetilgang } from '../tilgang/useSaksbehandlerHarSkrivetilgang'

const SaksbildeContent = memo(() => {
  const { sak } = useSak()
  const { behovsmelding } = useBehovsmelding()
  const harSkrivetilgang = useSaksbehandlerHarSkrivetilgang(sak?.tilganger)
  const { hjelpemiddelArtikler } = useHjelpemiddeloversikt(sak?.data?.bruker?.fnr)
  const { varsler, harVarsler } = useSøknadsVarsler()

  if (!sak || !behovsmelding) return <div>Fant ikke sak</div>

  const erBestilling = sak.data.sakstype === Sakstype.BESTILLING
  const levering = behovsmelding.levering
  const formidler = levering.hjelpemiddelformidler

  return (
    <Hovedinnhold
      columns={`max(${hovedInnholdMaxWidth} )  minmax(${hotsakHistorikkMinWidth}, ${hotsakHistorikkMaxWidth})`}
      /*style={{ maxWidth: `${hovedInnholdMaxWidth}` }}*/
    >
      <section>
        <HGrid columns="auto">
          <Søknadslinje id={sak.data.sakId} type={sak.data.sakstype} />
        </HGrid>
        <Saksinnhold columns={`${hotsakVenstremenyWidth} auto`}>
          <Venstremeny gap="5">
            <SøknadCard
              sakId={sak.data.sakId}
              sakstype={sak.data.sakstype}
              søknadGjelder={sak.data.søknadGjelder}
              søknadMottatt={sak.data.opprettet}
              funksjonsnedsettelser={behovsmelding.brukersituasjon.funksjonsnedsettelser}
              telefon={sak?.data.bruker.telefon}
            />
            <FormidlerCard
              tittel={erBestilling ? 'Bestiller' : 'Formidler'}
              stilling={formidler.stilling}
              formidlerNavn={formidler.navn}
              formidlerTelefon={formidler.telefon}
              kommune={formidler.adresse.poststed}
            />
            <LeveringCard
              levering={behovsmelding.levering}
              adresseBruker={formaterAdresse(behovsmelding.bruker.veiadresse)}
            />
            <GreitÅViteCard greitÅViteFakta={sak.data.greitÅViteFaktum} />
            {sak.data.sakstype === Sakstype.SØKNAD && (
              <VedtakCard sak={sak.data} oppgave={sak.oppgave} lesevisning={!harSkrivetilgang} />
            )}
            {erBestilling && (
              <BestillingCard
                bestilling={sak.data}
                hjelpemiddelArtikler={hjelpemiddelArtikler}
                oppgave={sak.oppgave}
                lesevisning={!harSkrivetilgang}
              />
            )}
          </Venstremeny>
          <section>
            {harVarsler && <Saksvarsler varsler={varsler} />}
            <Container>
              <Routes>
                <Route
                  path="/hjelpemidler"
                  element={<HjelpemiddelListeNyLayout sak={sak.data} behovsmelding={behovsmelding} />}
                />
                <Route
                  path="/bruker"
                  element={
                    <Bruker
                      bruker={sak.data.bruker}
                      behovsmeldingsbruker={behovsmelding.bruker}
                      brukerSituasjon={behovsmelding.brukersituasjon}
                      levering={behovsmelding.levering}
                      vilkår={behovsmelding.brukersituasjon.vilkår}
                    />
                  }
                />
                <Route path="/formidler" element={<Formidler levering={levering} />} />
              </Routes>
            </Container>
          </section>
        </Saksinnhold>
      </section>
      <Høyrekolonne />
    </Hovedinnhold>
  )
})

const Container = styled.section`
  padding: 0 var(--a-spacing-4);
  padding-top: 1rem;
  height: 100%;
  box-sizing: border-box;
`

export const Søknadsbilde = () => (
  <ErrorBoundary FallbackComponent={AlertError}>
    <Suspense fallback={<SakLoader />}>
      <SaksbildeContent />
    </Suspense>
  </ErrorBoundary>
)
