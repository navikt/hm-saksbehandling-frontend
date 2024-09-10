import { BriefcaseIcon, PersonIcon, PhoneIcon } from '@navikt/aksel-icons'

import type { Navn } from '../../types/types.internal'
import { formaterNavn, storForbokstavIAlleOrd } from '../../utils/formater'
import { VenstremenyCard } from './VenstremenyCard.tsx'
import { VenstremenyCardRow } from './VenstremenyCardRow.tsx'

export interface FormidlerCardProps {
  tittel: string
  formidlerNavn: string | Navn
  stilling: string
  kommune: string
  formidlerTelefon: string
}

// tooltip / title -> Kopier formidlers navn
// tooltip / title -> Kopier formidlers stilling
// tooltip / title -> Kopier telefonnummer

export function FormidlerCard({ tittel, formidlerNavn, kommune, formidlerTelefon, stilling }: FormidlerCardProps) {
  const formidlerNavnFormatert = formaterNavn(formidlerNavn)
  return (
    <VenstremenyCard heading={tittel}>
      <VenstremenyCardRow
        icon={<PersonIcon />}
        copyText={formidlerNavnFormatert}
        copyKind="formidlers navn"
      >{`${formidlerNavnFormatert}`}</VenstremenyCardRow>
      <VenstremenyCardRow
        icon={<BriefcaseIcon />}
        copyText={stilling}
        copyKind="formidlers stilling"
      >{`${storForbokstavIAlleOrd(stilling)} - ${storForbokstavIAlleOrd(kommune)}`}</VenstremenyCardRow>
      <VenstremenyCardRow icon={<PhoneIcon />} copyText={formidlerTelefon} copyKind="formidlers telefon">
        {formidlerTelefon}
      </VenstremenyCardRow>
    </VenstremenyCard>
  )
}
