import { Gruppe, useInnloggetSaksbehandler } from '../state/authentication'
import { TilgangResultat, TilgangType, Tilgang } from '../types/types.internal'

export function useSaksbehandlerHarSkrivetilgang(tilganger?: Tilgang): boolean {
  const { grupper } = useInnloggetSaksbehandler()

  // Hardkoder foreløpig til skrivetilgang i dev og prod frem til backend er klar for å vise dette på sak
  if (window.appSettings.MILJO === 'prod-gcp') {
    return true
  }
  if (window.appSettings.MILJO === 'dev-gcp') {
    // Kun midlertidig logikk for å teste om resten av logikken rundt lesemodus fungerer frem til ny policy løsning er på plass i backend
    const harSkrivetilgang = grupper.includes(Gruppe.HOTSAK_SAKSBEHANDLER)
    return harSkrivetilgang
  } else {
    return !!(tilganger?.[TilgangType.KAN_BEHANDLE_SAK] === TilgangResultat.TILLAT)
  }
}
