import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

import { Brevtype, Ressurs } from '../types/types.internal'
import { byggTomRessurs } from '../io/ressursFunksjoner'

interface ValgtDokumentType {
  journalpostId: string
  dokumentId: string
}

interface DokumentContextType {
  valgtDokument: ValgtDokumentType
  setValgtDokument(valgtDokument: ValgtDokumentType): void
  hentetDokument: Ressurs<string>
  settHentetDokument(hentetDokument: Ressurs<string>): void
  hentedeBrev: Record<Brevtype, Ressurs<string>>
  settHentetBrev(brevtype: Brevtype, hentetBrev: Ressurs<string>): void
}

const initialState: DokumentContextType = {
  valgtDokument: { journalpostId: '', dokumentId: '' },
  setValgtDokument() {},
  hentetDokument: byggTomRessurs<string>(),
  settHentetDokument() {},
  hentedeBrev: {
    [Brevtype.BARNEBRILLER_VEDTAK]: byggTomRessurs<string>(),
    [Brevtype.BARNEBRILLER_INNHENTE_OPPLYSNINGER]: byggTomRessurs<string>(),
    [Brevtype.JOURNALFØRT_NOTAT]: byggTomRessurs<string>(),
  },
  settHentetBrev() {},
}

export const DokumentContext = createContext<DokumentContextType>(initialState)

export function DokumentProvider({ children }: { children: ReactNode }) {
  const [valgtDokument, setValgtDokument] = useState<DokumentContextType['valgtDokument']>(initialState.valgtDokument)
  const [hentetDokument, settHentetDokument] = useState(initialState.hentetDokument)
  const [hentedeBrev, setHentedeBrev] = useState(initialState.hentedeBrev)

  const settHentetBrev = useCallback<DokumentContextType['settHentetBrev']>(
    (brevtype, hentetBrev) => setHentedeBrev({ ...hentedeBrev, [brevtype]: hentetBrev }),
    [hentedeBrev]
  )

  return (
    <DokumentContext.Provider
      value={{
        valgtDokument,
        setValgtDokument,
        hentetDokument,
        settHentetDokument,
        hentedeBrev,
        settHentetBrev,
      }}
    >
      {children}
    </DokumentContext.Provider>
  )
}

export function useDokumentContext(): DokumentContextType {
  const context = useContext(DokumentContext)

  if (!context) {
    throw new Error('useDokumentContext must be used within a DokumentProvider')
  }

  return context
}
