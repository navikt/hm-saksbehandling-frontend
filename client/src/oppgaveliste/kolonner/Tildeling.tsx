import { memo, useState } from 'react'

import { EllipsisCell, TekstCell } from '../../felleskomponenter/table/Celle'
import { Oppgave, Sakstype } from '../../types/types.internal'
import { IkkeTildelt } from './IkkeTildelt'
import { TaSakKonfliktModal } from '../../saksbilde/TaSakKonfliktModal.tsx'
import { useNavigate } from 'react-router-dom'

interface TildelingProps {
  oppgave: Oppgave
  onMutate: ((...args: any[]) => any) | null
}

export const Tildeling = memo(({ oppgave, onMutate }: TildelingProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()
  const onAapneSak = () => {
    const path = oppgave.sakstype !== Sakstype.TILSKUDD ? `/sak/${oppgave.sakId}/hjelpemidler` : `/sak/${oppgave.sakId}`
    navigate(path)
  }
  if (oppgave.saksbehandler || oppgave.kanTildeles) {
    return (
      <>
        {oppgave.saksbehandler && <EllipsisCell minLength={15} value={oppgave.saksbehandler.navn} />}
        {!oppgave.saksbehandler && oppgave.kanTildeles && (
          <IkkeTildelt
            oppgavereferanse={oppgave.sakId}
            gåTilSak={true}
            onMutate={onMutate}
            onTildelingKonflikt={() => {
              setModalOpen(true)
            }}
          />
        )}
        <TaSakKonfliktModal
          open={modalOpen}
          onAapneSak={onAapneSak}
          onClose={() => setModalOpen(false)}
          saksbehandler={oppgave.saksbehandler}
        />
      </>
    )
  }
  return <TekstCell value="-" />
})
