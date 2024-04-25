import React from 'react'
import styled from 'styled-components'

import { Box, CopyButton, Heading, HGrid, HGridProps, HStack, Tooltip } from '@navikt/ds-react'

import { capitalize, capitalizeName } from '../../utils/stringFormating'

import { Avstand } from '../../felleskomponenter/Avstand'
import { Liste } from '../../felleskomponenter/Liste'
import { Merknad } from '../../felleskomponenter/Merknad'
import { Strek } from '../../felleskomponenter/Strek'
import { Personikon } from '../../felleskomponenter/ikoner/Personikon'
import { Brødtekst, Etikett, Tekst } from '../../felleskomponenter/typografi'
import { Bosituasjon, Bruksarena, Formidler, Levering, Personinfo, PersonInfoKilde } from '../../types/types.internal'
import { Kontaktperson } from './Kontaktperson'
import { Leveringsmåte } from './Leveringsmåte'
import { Signatur } from './Signatur'
import { useOebsAdresser } from '../../personoversikt/useOebsAdresser'

export interface BrukerProps {
  person: Personinfo
  levering: Levering
  formidler: Formidler
  visOebsAdresser: boolean
}

export function Bruker({ person, levering, formidler, visOebsAdresser }: BrukerProps) {
  const { adresser } = useOebsAdresser(visOebsAdresser, person.fnr)
  const formatertNavn = formaterNavn(person)
  const adresse = `${capitalize(person.adresse)}, ${person.postnummer} ${capitalize(person.poststed)}`
  const bosituasjon = getTextForBosituasjon(person.bosituasjon)

  return (
    <>
      <Heading level="1" size="medium" spacing={false}>
        <TittelIkon width={22} height={22} />
        Hjelpemiddelbruker
      </Heading>
      <Box paddingBlock="4 8">
        <HGrid {...hGridProps}>
          <Etikett>Navn</Etikett>
          <Tekst>{formatertNavn}</Tekst>
          <Etikett>Fødselsnummer</Etikett>
          <Tekst>{person.fnr}</Tekst>
          <Etikett>{person.kilde === PersonInfoKilde.PDL ? 'Folkeregistert adresse' : 'Adresse'}</Etikett>
          <Tekst>{adresse}</Tekst>
          <Etikett>Telefon</Etikett>
          <Tekst>{person.telefon}</Tekst>
          {bosituasjon && (
            <>
              <Etikett>Boform</Etikett>
              <Tekst>{bosituasjon}</Tekst>
            </>
          )}
          {person.bruksarena && person.bruksarena !== Bruksarena.UKJENT && (
            <>
              <Etikett>Bruksarena</Etikett>
              <Tekst>{capitalize(person.bruksarena)}</Tekst>
            </>
          )}
          <Etikett>Funksjonsnedsettelse</Etikett>
          <Tekst>{capitalize(person.funksjonsnedsettelse.join(', '))}</Tekst>
        </HGrid>
      </Box>
      <Strek />

      {adresser.length > 0 && (
        <>
          <Heading level="1" size="medium" spacing={true}>
            Adresser fra OEBS
          </Heading>
          <Box paddingBlock="4 8">
            {adresser.map((adresse) => (
              <HGrid key={adresse.leveringAddresse} {...hGridProps}>
                <Etikett>Leveringsadresse</Etikett>
                {`${adresse.leveringAddresse}, ${adresse.leveringPostnr} ${adresse.leveringBy}`}
              </HGrid>
            ))}
          </Box>
          <Strek />
        </>
      )}

      <Heading level="1" size="medium" spacing={true}>
        Utlevering
      </Heading>
      <Box paddingBlock="4 8">
        <HGrid {...hGridProps} align="center">
          <Etikett>Leveringsadresse</Etikett>
          <Leveringsmåte levering={levering} brukerAdresse={adresse} />
          <Kontaktperson formidler={formidler} kontaktperson={levering.kontaktperson} />
          {levering.merknad && (
            <>
              <Merknad>
                <Avstand paddingTop={1} />
                <Etikett>Merknad til utlevering</Etikett>
              </Merknad>
              <HStack align="center">
                <Brødtekst>{levering.merknad}</Brødtekst>
                <Tooltip content="Kopier merknad til utlevering" placement="right">
                  <CopyButton size="small" copyText={levering.merknad} />
                </Tooltip>
              </HStack>
            </>
          )}
        </HGrid>
      </Box>

      <Strek />
      <Signatur signaturType={person.signaturtype} navn={formatertNavn} />
      <Strek />

      <Heading level="1" size="medium" spacing={true}>
        Vilkår for å motta hjelpemidler
      </Heading>
      <Box paddingBlock="4 8">
        <Liste>
          {person.oppfylteVilkår.map((vilkår, i) => (
            <li key={i}>
              <Brødtekst>{vilkårTekst(vilkår, formatertNavn)}</Brødtekst>
            </li>
          ))}
        </Liste>
      </Box>
    </>
  )
}

const hGridProps: Partial<HGridProps> = {
  columns: 'minmax(min-content, 12rem) auto',
  gap: '05',
}

const TittelIkon = styled(Personikon)`
  padding-right: 0.5rem;
`

function formaterNavn(person: Personinfo) {
  return capitalizeName(`${person.fornavn} ${person.mellomnavn ? `${person.mellomnavn}` : ''} ${person.etternavn}`)
}

function vilkårTekst(vilkår: string, navn: string) {
  if (vilkår === 'nedsattFunksjon') {
    return `${navn} har vesentlig og varig nedsatt funksjonsevne som følge av sykdom, skade eller lyte. Med varig menes 2 år eller livet ut.`
  }

  if (vilkår === 'praktiskeProblem') {
    return `Hjelpemiddelet(ene) er nødvendig for å avhjelpe praktiske problemer i dagliglivet eller bli pleid i hjemmet. ${navn} sitt behov kan ikke løses med enklere og rimeligere hjelpemidler eller ved andre tiltak som ikke dekkes av NAV.`
  }

  if (vilkår === 'storreBehov') {
    return `Hjelpemiddelet(ene) er egnet til å avhjelpe funksjonsnedsettelsen og ${navn} vil være i stand til å bruke det.`
  }

  if (vilkår === 'PRAKTISKE_PROBLEMER_I_DAGLIGLIVET_V1') {
    return `Hjelpemiddelet er nødvendig for å avhjelpe praktiske problemer i dagliglivet, eller for å bli pleid i hjemmet.`
  }

  if (vilkår === 'VESENTLIG_OG_VARIG_NEDSATT_FUNKSJONSEVNE_V1') {
    return `${navn} har vesentlig og varig nedsatt funksjonsevne som følge av sykdom, skade eller lyte. Med varig menes 2 år eller livet ut. Hjelpemiddelet skal ikke brukes til korttidsutlån eller til andre formål.`
  }

  if (vilkår === 'KAN_IKKE_LOESES_MED_ENKLERE_HJELPEMIDLER_V1') {
    return `${navn} sitt behov kan ikke løses med enklere og rimeligere hjelpemidler, eller ved andre tiltak som ikke dekkes av NAV.`
  }

  if (vilkår === 'I_STAND_TIL_AA_BRUKE_HJELEPMIDLENE_V1') {
    return `${navn} vil være i stand til å bruke hjelpemidlene. Jeg har ansvaret for at hjelpemidlene blir levert, og at nødvendig opplæring, tilpasning og montering blir gjort.`
  }
}

function getTextForBosituasjon(bosituasjon: Bosituasjon | null) {
  switch (bosituasjon) {
    case null:
      return null
    case Bosituasjon.HJEMME:
      return 'Hjemme (egen bolig, omsorgsbolig eller bofellesskap)'
    case Bosituasjon.HJEMME_EGEN_BOLIG:
      return 'Hjemme i egen bolig'
    case Bosituasjon.HJEMME_OMSORG_FELLES:
      return 'Hjemme i omsorgsbolig, bofellesskap eller servicebolig'
    case Bosituasjon.INSTITUSJON:
      return 'Institusjon'
    default:
      return 'Ukjent bosituasjon'
  }
}
