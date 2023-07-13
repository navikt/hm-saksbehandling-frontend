import React from 'react'
import styled from 'styled-components'

import { Link } from '@navikt/ds-react'

import { norskTimestamp } from '../../../utils/date'

import { Etikett, Tekst, Undertittel } from '../../../felleskomponenter/typografi'
import { Saksdokument } from '../../../types/types.internal'

const ByggDummyDataUrl = React.lazy(() => import('../../../mocks/mockDokument'))
const erLokaltEllerLabs = window.appSettings.USE_MSW === true

const Container = styled.li`
  margin: 0;
  padding: 16px 0;
  display: flex;

  &:not(:last-of-type) {
    border-bottom: 1px solid var(--a-border-default);
  }
`

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
`

export const BrevKort: React.FC<Saksdokument> = ({
  tittel,
  opprettetDato,
  saksbehandler,
  journalpostID,
  dokumentID,
}) => {
  return (
    <Container>
      <ContentContainer>
        <Etikett>
          {erLokaltEllerLabs ? (
            <ByggDummyDataUrl tittel={tittel} />
          ) : (
            <Link href={`/api/journalpost/${journalpostID}/${dokumentID}`} target="_blank">
              {tittel}
            </Link>
          )}
        </Etikett>
        {opprettetDato && <Undertittel>{norskTimestamp(opprettetDato)}</Undertittel>}

        <Tekst>{saksbehandler.navn}</Tekst>
      </ContentContainer>
    </Container>
  )
}
