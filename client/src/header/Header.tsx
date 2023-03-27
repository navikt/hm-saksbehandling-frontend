import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { System } from '@navikt/ds-icons'
import { Link } from '@navikt/ds-react'
import { Dropdown, Header } from '@navikt/ds-react-internal'

import { usePersonContext } from '../personoversikt/PersonContext'
import { useInnloggetSaksbehandler } from '../state/authentication'
import { Søk } from './Søk'
import { EndringsloggDropdown } from './endringslogg/EndringsloggDropdown'

const SøkeContainer = styled.div`
  padding-top: 0.5rem;
  padding-left: 1rem;
  margin-right: auto;
`

const Lenke = styled.a`
  text-decoration: none;
`

export const Toppmeny: React.FC = () => {
  const { erInnlogget, enheter, ...rest } = useInnloggetSaksbehandler()
  const saksbehandler = erInnlogget ? rest : { navn: 'Ikke pålogget', navIdent: '' }
  const { setFodselsnummer } = usePersonContext()
  const navigate = useNavigate()

  return (
    <Header style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Header.Title href="/">HOTSAK</Header.Title>
      <SøkeContainer>
        <Søk
          onSearch={(value: string) => {
            setFodselsnummer(value)
            navigate('/personoversikt/saker')
          }}
        />
      </SøkeContainer>
      <EndringsloggDropdown />
      <Dropdown>
        <Header.Button as={Dropdown.Toggle}>
          <System title="Systemer og oppslagsverk" />
        </Header.Button>
        <Dropdown.Menu>
          <Dropdown.Menu.GroupedList>
            <Dropdown.Menu.GroupedList.Heading>Systemer og oppslagsverk</Dropdown.Menu.GroupedList.Heading>
            <Dropdown.Menu.GroupedList.Item>
              <Link href="https://gosys.intern.nav.no/gosys/" target="_new">
                Gosys
              </Link>
            </Dropdown.Menu.GroupedList.Item>
            <Dropdown.Menu.GroupedList.Item>
              <Link href="https://app.adeo.no/modiapersonoversikt" target="_new">
                Modia
              </Link>
            </Dropdown.Menu.GroupedList.Item>
          </Dropdown.Menu.GroupedList>
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown>
        <Header.UserButton
          as={Dropdown.Toggle}
          title={enheter.join(', ')}
          name={saksbehandler.navn}
          description={saksbehandler.navIdent}
        />
        <Dropdown.Menu>
          <Dropdown.Menu.List>
            <Lenke href="/logout">
              <Dropdown.Menu.List.Item>Logg ut</Dropdown.Menu.List.Item>
            </Lenke>
          </Dropdown.Menu.List>
        </Dropdown.Menu>
      </Dropdown>
    </Header>
  )
}
