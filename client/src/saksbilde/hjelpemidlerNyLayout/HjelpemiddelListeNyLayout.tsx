import { Box, Heading, VStack } from '@navikt/ds-react'
import { Skillelinje } from '../../felleskomponenter/Strek.tsx'
import { BehovsmeldingType, Innsenderbehovsmelding } from '../../types/BehovsmeldingTypes.ts'
import { Sak } from '../../types/types.internal.ts'
import { BrukersFunksjon } from '../hjelpemidler/BrukersFunksjon.tsx'
import { OebsAlert } from '../hjelpemidler/OebsAlert.tsx'
import { useArtiklerForSak } from '../hjelpemidler/useArtiklerForSak.ts'
import { Hast } from './Hast.tsx'
import { Hjelpemiddel } from './Hjelpemiddel.tsx'
import { TilbehørListe } from './TilbehørListe.tsx'
import { useFinnHjelpemiddel } from '../hjelpemidler/useFinnHjelpemiddel.ts'
import { storForbokstavIOrd } from '../../utils/formater.ts'

interface HjelpemiddelListeProps {
  sak: Sak
  behovsmelding: Innsenderbehovsmelding
}

export function HjelpemiddelListeNyLayout({ sak, behovsmelding }: HjelpemiddelListeProps) {
  const { artikler } = useArtiklerForSak(sak.sakId)

  const artiklerSomIkkeFinnesIOebs = artikler.filter((artikkel) => !artikkel.finnesIOebs)
  const { brukersituasjon, levering } = behovsmelding
  const hjelpemidler = behovsmelding.hjelpemidler.hjelpemidler
  const tilbehør = behovsmelding.hjelpemidler.tilbehør

  const alleHmsNr = [
    ...hjelpemidler.flatMap((hjelpemiddel) => [
      hjelpemiddel.produkt.hmsArtNr,
      ...hjelpemiddel.tilbehør.map((tilbehør) => tilbehør.hmsArtNr),
    ]),
    ...tilbehør.map((tilbehør) => tilbehør.hmsArtNr),
  ]

  const finnHjelpemiddelProdukter = useFinnHjelpemiddel(alleHmsNr)

  const funksjonsbeskrivelse = brukersituasjon.funksjonsbeskrivelse

  return (
    <VStack gap="4">
      <Heading level="1" size="small" visuallyHidden={true}>
        {storForbokstavIOrd(sak.sakstype)}
      </Heading>
      {levering.hast && <Hast hast={levering.hast} />}

      {hjelpemidler.length > 0 && (
        <Heading level="2" size="medium">
          Hjelpemidler
        </Heading>
      )}
      {behovsmelding.type === BehovsmeldingType.SØKNAD && artiklerSomIkkeFinnesIOebs.length > 0 && (
        <OebsAlert artikler={artiklerSomIkkeFinnesIOebs} />
      )}
      {hjelpemidler.map((hjelpemiddel) => (
        <Hjelpemiddel
          key={hjelpemiddel.produkt.hmsArtNr}
          hjelpemiddel={hjelpemiddel}
          sak={sak}
          produkter={finnHjelpemiddelProdukter}
        />
      ))}
      {tilbehør && tilbehør.length > 0 && (
        <>
          <Heading level="2" size="small">
            Tilbehør
          </Heading>
          <Box paddingInline="4 0">
            <TilbehørListe tilbehør={tilbehør} frittståendeTilbehør={true} produkter={finnHjelpemiddelProdukter} />
          </Box>
          <Skillelinje />
        </>
      )}
      {funksjonsbeskrivelse && <BrukersFunksjon funksjonsbeskrivelse={funksjonsbeskrivelse} />}
    </VStack>
  )
}
