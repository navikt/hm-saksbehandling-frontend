import 'date-fns'
import { formatISO } from 'date-fns'
import React, { useState } from 'react'
import { useErrorBoundary } from 'react-error-boundary'
import { FormProvider, useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import styled from 'styled-components'

import { Button, Heading, Loader } from '@navikt/ds-react'

import { postVilkårsvurdering, putSendTilGosys } from '../../../../io/http'
import { Dokumenter } from '../../../../oppgaveliste/manuellJournalføring/Dokumenter'
import { toDate } from '../../../../utils/date'

import { Avstand } from '../../../../felleskomponenter/Avstand'
import { Knappepanel } from '../../../../felleskomponenter/Button'
import {
  MålformType,
  OppgaveStatusType,
  Oppgavetype,
  OverforGosysTilbakemelding,
  RegistrerSøknadData,
  StegType,
  VilkårsResultat,
} from '../../../../types/types.internal'
import { OverførGosysModal } from '../../../OverførGosysModal'
import { useJournalposter } from '../../../journalpostHook'
import { useBrillesak } from '../../../sakHook'
import { useManuellSaksbehandlingContext } from '../../ManuellSaksbehandlingTabContext'
import { RegistrerBrillegrunnlag } from './RegistrerBrillegrunnlag'
import { Målform } from './skjemaelementer/Målform'
import { Opplysningsplikt } from './skjemaelementer/Opplysningsplikt'

const Container = styled.div`
  overflow: auto;
  padding-top: var(--a-spacing-6);
`

export const RegistrerSøknadSkjema: React.FC = () => {
  const { saksnummer: sakId } = useParams<{ saksnummer: string }>()
  const { sak, isLoading, isError, mutate } = useBrillesak()
  const { setValgtTab } = useManuellSaksbehandlingContext()
  const [venterPåVilkårsvurdering, setVenterPåVilkårsvurdering] = useState(false)
  const { showBoundary } = useErrorBoundary()
  const [visGosysModal, setVisGosysModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const { dokumenter } = useJournalposter()

  const antallJournalposter = new Set(dokumenter.map((dokument) => dokument.journalpostID)).size

  const vurderVilkår = (formData: RegistrerSøknadData) => {
    const { opplysningsplikt, målform, ...grunnlag } = { ...formData }

    let vurderVilkårRequest

    if (opplysningsplikt.vilkårOppfylt === VilkårsResultat.JA) {
      const { bestillingsdato, ...rest } = { ...grunnlag }

      vurderVilkårRequest = {
        sakId: sakId!,
        sakstype: Oppgavetype.BARNEBRILLER,
        opplysningsplikt: opplysningsplikt,
        målform: målform,
        data: {
          bestillingsdato: formatISO(bestillingsdato, { representation: 'date' }),
          ...rest,
        },
      }
    } else {
      vurderVilkårRequest = {
        sakId: sakId!,
        sakstype: Oppgavetype.BARNEBRILLER,
        opplysningsplikt: opplysningsplikt,
        målform: målform,
        data: undefined,
      }
    }

    setVenterPåVilkårsvurdering(true)
    postVilkårsvurdering(vurderVilkårRequest)
      .catch(() => setVenterPåVilkårsvurdering(false))
      .then(() => {
        setValgtTab(StegType.VURDERE_VILKÅR)
        mutate()
        setVenterPåVilkårsvurdering(false)
      })
  }

  const sendTilGosys = (tilbakemelding: OverforGosysTilbakemelding) => {
    setLoading(true)
    putSendTilGosys(sakId!, tilbakemelding)
      .catch(() => setLoading(false))
      .then(() => {
        setLoading(false)
        setVisGosysModal(false)
        mutate(`api/sak/${sakId}`)
        mutate(`api/sak/${sakId}/historikk`)
      })
  }

  const methods = useForm<RegistrerSøknadData>({
    defaultValues: {
      målform: sak?.data.vilkårsgrunnlag?.målform || MålformType.BOKMÅL,
      opplysningsplikt: {
        vilkårOppfylt: sak?.data.vilkårsgrunnlag?.opplysningsplikt.vilkårOppfylt || '',
        begrunnelse: '',
      },
      bestillingsdato: toDate(sak?.data.vilkårsgrunnlag?.data?.bestillingsdato),
      brilleseddel: {
        høyreSfære: sak?.data.vilkårsgrunnlag?.data?.brilleseddel.høyreSfære.toString() || '',
        høyreSylinder: sak?.data.vilkårsgrunnlag?.data?.brilleseddel.høyreSylinder.toString() || '',
        venstreSfære: sak?.data.vilkårsgrunnlag?.data?.brilleseddel.venstreSfære.toString() || '',
        venstreSylinder: sak?.data.vilkårsgrunnlag?.data?.brilleseddel.venstreSylinder.toString() || '',
      },
      brillepris: sak?.data.vilkårsgrunnlag?.data?.brillepris || '',
      bestiltHosOptiker: {
        vilkårOppfylt: sak?.data.vilkårsgrunnlag?.data?.bestiltHosOptiker.vilkårOppfylt || '',
        begrunnelse: sak?.data.vilkårsgrunnlag?.data?.bestiltHosOptiker.begrunnelse || '',
      },
      komplettBrille: {
        vilkårOppfylt: sak?.data.vilkårsgrunnlag?.data?.komplettBrille.vilkårOppfylt || '',
        begrunnelse: sak?.data.vilkårsgrunnlag?.data?.komplettBrille.begrunnelse || '',
      },
    },
  })

  const {
    formState: { errors },
    watch,
  } = methods

  if (isLoading) {
    return (
      <div>
        <Loader />
        Henter sak...
      </div>
    )
  }

  const opplysningsplikt = watch('opplysningsplikt')

  const visSkjemaelementForOpplysningsplikt: boolean =
    sak?.data.status === OppgaveStatusType.AVVENTER_DOKUMENTASJON || antallJournalposter > 1

  const skjulSkjemaFelter =
    visSkjemaelementForOpplysningsplikt &&
    (opplysningsplikt.vilkårOppfylt === VilkårsResultat.NEI || opplysningsplikt.vilkårOppfylt === '')

  return (
    <Container>
      <Heading level="1" size="xsmall" spacing>
        Registrer søknad
      </Heading>
      <Dokumenter dokumenter={dokumenter} />
      <Avstand paddingTop={4} paddingLeft={2}>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit((data) => {
              vurderVilkår(data)
            })}
            autoComplete="off"
          >
            <Målform />
            {visSkjemaelementForOpplysningsplikt && <Opplysningsplikt />}
            {!skjulSkjemaFelter && <RegistrerBrillegrunnlag />}

            <Avstand paddingLeft={2}>
              <Knappepanel>
                <Button
                  type="submit"
                  variant="primary"
                  size="small"
                  disabled={venterPåVilkårsvurdering}
                  loading={venterPåVilkårsvurdering}
                >
                  Neste
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setVisGosysModal(true)}
                  data-cy="btn-vis-gosys-modal"
                >
                  Overfør til Gosys
                </Button>
              </Knappepanel>
            </Avstand>
          </form>
        </FormProvider>
      </Avstand>
      <OverførGosysModal
        open={visGosysModal}
        loading={loading}
        årsaker={overforGosysArsaker}
        legend="Hvorfor vil du overføre saken?"
        onBekreft={(tilbakemelding) => {
          sendTilGosys(tilbakemelding)
        }}
        onClose={() => setVisGosysModal(false)}
      />
    </Container>
  )
}

const overforGosysArsaker: ReadonlyArray<string> = [
  'Behandlingsbriller/linser ordinære vilkår',
  'Behandlingsbriller/linser særskilte vilkår',
  'Annet',
]
