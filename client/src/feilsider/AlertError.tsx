import { Alert } from '@navikt/ds-react'
import styled from 'styled-components/macro'

interface AlertErrorProps {
  error: Error
}

const FeilmeldingContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
`


export const AlertError = (props: AlertErrorProps) => {
  const { error } = props
  return (
    <FeilmeldingContainer>
      <Alert size="small" variant="error">{error.message}</Alert>
    </FeilmeldingContainer>
  )
}
