import { ChangeEvent } from 'react'
import styled from 'styled-components'

import { Detail, HStack, Loader, Textarea, VStack } from '@navikt/ds-react'

export const Bakgrunnslagring = styled(HStack)`
  display: flex;

  justify-content: right;
  vertical-align: baseline;
  gap: 0.4rem;
  padding-top: 0.5rem;
  padding-right: 0.6rem;
  height: var(--a-spacing-8);
  margin-left: auto;
`

export const Fritekst = ({
  label,
  fritekst,
  beskrivelse,
  valideringsfeil,
  lagrer,
  onTextChange,
}: {
  label: string
  fritekst: string
  beskrivelse: string
  valideringsfeil?: string
  lagrer: boolean
  onTextChange: any
}) => {
  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(event.target.value)
  }

  return (
    <VStack>
      <Textarea
        minRows={5}
        maxRows={20}
        label={label}
        error={valideringsfeil}
        description={beskrivelse}
        size="small"
        value={fritekst}
        onChange={(event) => onChange(event)}
      />
      <Bakgrunnslagring>
        {lagrer && (
          <>
            <span>
              <Loader size="xsmall" />
            </span>
            <span>
              <Detail>Lagrer</Detail>
            </span>
          </>
        )}
      </Bakgrunnslagring>
    </VStack>
  )
}
