import { createRoot } from 'react-dom/client'
import 'reset-css'

import '@navikt/ds-css'
import '@navikt/ds-css-internal'
import { Modal } from '@navikt/ds-react'

import { setupAmplitude } from './utils/amplitude'

import App from './App'
import { AppRoot } from './GlobalStyles'
import { setupMsw } from './mocks'

setupMsw()
  .then(() => {
    const container = document.getElementById('root')!
    if (Modal.setAppElement) {
      Modal.setAppElement(container)
    }
    createRoot(container).render(
      <>
        <AppRoot />
        <App />
      </>
    )
  })
  .then(() => setupAmplitude())
  .catch((err) => console.error(err))
