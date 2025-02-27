import { usePerson } from '../personoversikt/usePerson.ts'
import { useSak } from '../saksbilde/useSak.ts'
import { useSaksbehandlerErTildeltSak } from '../tilgang/useSaksbehandlerErTildeltSak.ts'
import { OppgaveStatusType, Sakstype } from '../types/types.internal.ts'

export function useSaksregler() {
  const { data: sak } = useSak()?.sak ?? { data: undefined }
  const { personInfo: person } = usePerson(sak?.bruker.fnr)

  const saksbehandlerErTildeltSak = useSaksbehandlerErTildeltSak(sak)

  const kanBehandleSak = !!(saksbehandlerErTildeltSak && sak?.status === OppgaveStatusType.TILDELT_SAKSBEHANDLER)

  console.log(
    'Kan endre hmsnr? ',
    sak?.sakstype,
    saksbehandlerErTildeltSak,
    sak?.status,
    !!(
      sak?.sakstype === Sakstype.BESTILLING &&
      saksbehandlerErTildeltSak &&
      sak?.status === OppgaveStatusType.TILDELT_SAKSBEHANDLER
    )
  )

  return {
    sakId: sak?.sakId,
    kanEndreHmsnr(): boolean {
      return !!(
        sak?.sakstype === Sakstype.BESTILLING &&
        saksbehandlerErTildeltSak &&
        sak?.status === OppgaveStatusType.TILDELT_SAKSBEHANDLER
      )
    },
    kanHenleggeSak(): boolean {
      return !!(saksbehandlerErTildeltSak && person?.dødsdato)
    },
    kanBehandleSak,
  }
}
