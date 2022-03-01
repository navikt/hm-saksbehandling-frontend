import React from 'react'
import { Toast } from '../felleskomponenter/Toast'
import { IngenOppgaver } from './IngenOppgaver'
import styled from 'styled-components/macro'
import { useOppgaveliste } from './oppgavelisteHook'
import { Panel, Table } from '@navikt/ds-react'
import { Bosted } from './kolonner/Bosted'
import { Funksjonsnedsettelse } from './kolonner/Funksjonsnedsettelse'
import { Fødselsnummer } from './kolonner/Fødselsnummer'
import { Gjelder } from './kolonner/Gjelder'
import { Hjelpemiddelbruker } from './kolonner/Hjelpemiddelbruker'
import { Motatt } from './kolonner/Motatt'
import { Status } from './kolonner/Status'
import { Tildeling } from './kolonner/Tildeling'
import { capitalize } from '../utils/stringFormating'
import { FormidlerCelle } from './kolonner/Formidler'
import { MenyKnapp } from './kolonner/MenyKnapp'
import {
  OmrådeFilter,
  OmrådeFilterLabel,
  Oppgave,
  OppgaveStatusLabel,
  OppgaveStatusType,
  SakerFilter,
  SakerFilterLabel,
} from '../types/types.internal'
import { FilterDropdown, Filters } from './filter'
import { LinkRow } from '../felleskomponenter/table/LinkRow'
import { Paging } from './paging/Paging'
import { DataCell, KolonneHeader } from '../felleskomponenter/table/KolonneHeader'
import { useFilterContext } from './stateManagement/FilterContext'

const Container = styled.div`
  min-height: 300px;
  height: calc(100% - 50px);
  width: 100%;
`

const ScrollWrapper = styled.div`
  overflow: auto;
`

export const Oppgaveliste = () => {
  const {
    sakerFilter,
    setSakerFilter,
    statusFilter,
    setStatusFilter,
    områdeFilter,
    setOmrådeFilter,
    currentPage,
    setCurrentPage,
    sort,
    setSort,
  } = useFilterContext()

  const { oppgaver, isError, isLoading, totalCount, mutate } = useOppgaveliste(currentPage, sort, {
    sakerFilter,
    statusFilter,
    områdeFilter,
  })

  const handleFilter = (handler: Function, value: SakerFilter | OppgaveStatusType | OmrådeFilter) => {
    handler(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSakerFilter(SakerFilter.UFORDELTE)
    setStatusFilter(OppgaveStatusType.ALLE)
    setOmrådeFilter(OmrådeFilter.ALLE)
    setCurrentPage(1)
  }

  const kolonner = [
    { key: 'EIER', name: 'Eier', width: 152, render: (oppgave: Oppgave) => <Tildeling oppgave={oppgave} /> },
    {
      key: 'STATUS',
      name: 'Status',
      width: 154,
      render: (oppgave: Oppgave) => <Status status={OppgaveStatusLabel.get(oppgave.status)!} saksID={oppgave.saksid} />,
    },
    {
      key: 'FUNKSJONSNEDSETTELSE',
      name: 'Område',
      width: 152,
      render: (oppgave: Oppgave) => (
        <Funksjonsnedsettelse
          funksjonsnedsettelser={oppgave.personinformasjon.funksjonsnedsettelse}
          saksID={oppgave.saksid}
        />
      ),
    },
    {
      key: 'SØKNAD_OM',
      name: 'Søknad om',
      width: 192,
      render: (oppgave: Oppgave) => <Gjelder søknadOm={capitalize(oppgave.søknadOm)} saksID={oppgave.saksid} />,
    },
    {
      key: 'HJELPEMIDDELBRUKER',
      name: 'Hjelpemiddelbruker',
      width: 188,
      render: (oppgave: Oppgave) => <Hjelpemiddelbruker person={oppgave.personinformasjon} saksID={oppgave.saksid} />,
    },
    {
      key: 'FØDSELSNUMMER',
      name: 'Fødselsnr.',
      width: 124,
      render: (oppgave: Oppgave) => <Fødselsnummer fødselsnummer={oppgave.personinformasjon.fnr} />,
    },
    {
      key: 'BOSTED',
      name: 'Kommune / bydel',
      width: 165,
      render: (oppgave: Oppgave) => <Bosted bosted={oppgave.personinformasjon.bosted} saksID={oppgave.saksid} />,
    },
    {
      key: 'FORMIDLER',
      name: 'Formidler',
      width: 164,
      render: (oppgave: Oppgave) => <FormidlerCelle saksID={oppgave.saksid} formidlerNavn={oppgave.formidlerNavn} />,
    },
    {
      key: 'MOTTATT',
      name: 'Mottatt dato',
      width: 140,
      render: (oppgave: Oppgave) => <Motatt dato={oppgave.mottattDato} />,
    },
    { key: 'MENU', sortable: false, render: (oppgave: Oppgave) => <MenyKnapp oppgave={oppgave} onMutate={mutate} /> },
  ]

  if (isError) {
    throw Error('Feil med henting av oppgaver')
  }

  console.log("Sort", sort, sakerFilter, statusFilter, områdeFilter, currentPage)

  //useLoadingToast({ isLoading: oppgaver.state === 'loading', message: 'Henter oppgaver' });
  const hasData = oppgaver && oppgaver.length > 0
  return (
    <>
      <Filters onClear={clearFilters}>
        <FilterDropdown
          handleChange={(filterValue: SakerFilter) => {
            handleFilter(setSakerFilter, filterValue)
          }}
          label="Saker"
          value={sakerFilter}
          options={SakerFilterLabel}
        />
        <FilterDropdown
          handleChange={(filterValue: SakerFilter) => {
            handleFilter(setStatusFilter, filterValue)
          }}
          label="Status"
          value={statusFilter}
          options={OppgaveStatusLabel}
        />
        <FilterDropdown
          handleChange={(filterValue: SakerFilter) => {
            handleFilter(setOmrådeFilter, filterValue)
          }}
          label="Område"
          value={områdeFilter}
          options={OmrådeFilterLabel}
        />
      </Filters>

      {isLoading ? (
        <Toast>Henter oppgaver </Toast>
      ) : (
        <Container>
          <Panel>
            {hasData ? (
              <ScrollWrapper>
                <Table
                  style={{ width: 'initial' }}
                  zebraStripes
                  size="small"
                  sort={sort}
                  onSortChange={(sortKey) => {
                    setSort({
                      orderBy: sortKey || 'mottatt',
                      direction: sort?.direction === 'ascending' ? 'descending' : 'ascending',
                    })
                  }}
                >
                  <Table.Header>
                    <Table.Row>
                      {kolonner.map(({ key, name, sortable = true, width }, idx) => (
                        <KolonneHeader key={key} sortable={sortable} sortKey={key} width={width}>
                          {name}
                        </KolonneHeader>
                      ))}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {oppgaver.map((oppgave) => (
                      <LinkRow key={oppgave.saksid} saksnummer={oppgave.saksid}>
                        {kolonner.map(({ render, width, key }, idx) => (
                          <DataCell
                            key={key}
                            width={width}
                            style={{
                              padding: 'var(--navds-spacing-1) 0rem var(--navds-spacing-1) var(--navds-spacing-3)',
                            }}
                          >
                            {render(oppgave)}
                          </DataCell>
                        ))}
                      </LinkRow>
                    ))}
                  </Table.Body>
                </Table>

                <Paging
                  totalCount={totalCount}
                  currentPage={currentPage}
                  onPageChange={(page: number) => setCurrentPage(page)}
                />
              </ScrollWrapper>
            ) : (
              <IngenOppgaver />
            )}
          </Panel>
        </Container>
      )}
    </>
  )
}

export default Oppgaveliste
