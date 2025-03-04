import { ArchiveIcon, ClockDashedIcon, NotePencilDashIcon, WheelchairIcon } from '@navikt/aksel-icons'

import { Box, Tabs, Tag, Tooltip } from '@navikt/ds-react'
import { useState } from 'react'
import { søknadslinjeHøyde } from '../../GlobalStyles'
import { useSaksregler } from '../../saksregler/useSaksregler'
import { useErNotatPilot } from '../../state/authentication'
import { HøyrekolonneTabs } from '../../types/types.internal'
import { JournalførteNotater } from '../journalførteNotater/JornalførteNotater.tsx'
import { useSak } from '../useSak'
import { Historikk } from './historikk/Historikk'
import { Hjelpemiddeloversikt } from './hjelpemiddeloversikt/Hjelpemiddeloversikt'
import { useHjelpemiddeloversikt } from './hjelpemiddeloversikt/useHjelpemiddeloversikt'
import { HøyrekolonnePanel } from './HøyrekolonnePanel.tsx'
import { Saksnotater } from './notat/Saksnotater'
import { useSaksnotater } from './notat/useSaksnotater'
//import { useJournalførteNotater } from './notat/useJournalførteNotater.tsx'
//import styled from 'styled-components'

export function Høyrekolonne() {
  const [valgtHøyrekolonneTab, setValgtHøyrekolonneTab] = useState(HøyrekolonneTabs.HJELPEMIDDELOVERSIKT.toString())
  const { kanBehandleSak } = useSaksregler()
  const { sak } = useSak()
  //const { journalførteNotater, isLoading: henterJournalførteNotater } = useJournalførteNotater(sak?.data.sakId)
  const { notater } = useSaksnotater(sak?.data.sakId)
  const erNotatPilot = useErNotatPilot()
  const { hjelpemiddelArtikler, error, isLoading } = useHjelpemiddeloversikt(
    sak?.data.bruker.fnr,
    sak?.data.vedtak?.vedtaksgrunnlag
  )

  const antallNotater = notater?.length
  const antallUtlånteHjelpemidler = hjelpemiddelArtikler?.reduce((antall, artikkel) => antall + artikkel.antall, 0)

  return (
    <Box borderWidth="0 1" borderColor="border-subtle">
      <Tabs
        size="small"
        value={valgtHøyrekolonneTab}
        defaultValue={HøyrekolonneTabs.HJELPEMIDDELOVERSIKT.toString()}
        onChange={setValgtHøyrekolonneTab}
        loop
      >
        <Tabs.List style={{ height: `${søknadslinjeHøyde}` }}>
          <Tooltip content="Historikk">
            <Tabs.Tab value={HøyrekolonneTabs.SAKSHISTORIKK} icon={<ClockDashedIcon title="Sakshistorikk" />} />
          </Tooltip>
          <Tooltip content="Utlånsoversikt">
            <Tabs.Tab
              value={HøyrekolonneTabs.HJELPEMIDDELOVERSIKT}
              icon={
                <>
                  <WheelchairIcon title="Utlånsoversikt" />
                  {!isLoading && !error && (
                    <Tag variant="neutral-moderate" size="xsmall">
                      {antallUtlånteHjelpemidler}
                    </Tag>
                  )}
                </>
              }
            />
          </Tooltip>
          {erNotatPilot && (
            <Tooltip content="Notat">
              <Tabs.Tab
                value={HøyrekolonneTabs.NOTAT}
                icon={
                  <>
                    <NotePencilDashIcon title="Notat" />
                    {notater && (
                      <Tag variant="neutral-moderate" size="xsmall">
                        {antallNotater}
                      </Tag>
                    )}
                  </>
                }
              />
            </Tooltip>
          )}
          {sak != null && (
            <Tooltip content="Journalførte notater">
              <Tabs.Tab
                value={HøyrekolonneTabs.JOURNALFØRINGSNOTAT}
                icon={
                  <>
                    <ArchiveIcon title="Journalførte notater" />
                    {/*!henterJournalførteNotater && (
                      <Tag variant="neutral-moderate" size="xsmall" style={{ position: 'relative' }}>
                        {journalførteNotater?.antallNotater}
                        {journalførteNotater?.harUtkast && <NotificationBadge />}
                      </Tag>
                    )*/}
                  </>
                }
              />
            </Tooltip>
          )}
        </Tabs.List>
        <Tabs.Panel value={HøyrekolonneTabs.SAKSHISTORIKK.toString()}>
          <Historikk />
        </Tabs.Panel>
        <Tabs.Panel value={HøyrekolonneTabs.HJELPEMIDDELOVERSIKT.toString()}>
          <Hjelpemiddeloversikt />
        </Tabs.Panel>
        {erNotatPilot && (
          <Tabs.Panel value={HøyrekolonneTabs.NOTAT.toString()}>
            <Saksnotater sakId={sak?.data.sakId} lesevisning={!kanBehandleSak} />
          </Tabs.Panel>
        )}
        {sak != null && (
          <Tabs.Panel value={HøyrekolonneTabs.JOURNALFØRINGSNOTAT.toString()}>
            <HøyrekolonnePanel tittel="Journalførte notater">
              <JournalførteNotater sak={sak.data} lesevisning={!kanBehandleSak} />
            </HøyrekolonnePanel>
          </Tabs.Panel>
        )}
      </Tabs>
    </Box>
  )
}

/*const NotificationBadge = styled.span`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  border-radius: 9999px;
  border: 2px solid var(--a-surface-default);
  background: var(--a-surface-danger);
  width: 12px;
  height: 12px;
`*/
