export const clearIndexDb = () => {
  cy.clearIndexedDb('SaksbehandlerStore')
  cy.clearIndexedDb('PersonStore')
  cy.clearIndexedDb('HjelpemiddelStore')
  cy.clearIndexedDb('JournalpostStore')
  cy.clearIndexedDb('SakStore')
  cy.clearIndexedDb('BarnebrillesakStore')
}

export const plukkSak = (saksnummer: string) => {
  cy.visit(`/sak/${saksnummer}/hjelpemidler`)
  cy.findAllByRole('button', { name: /Ta saken/i })
    .first()
    .click()
}

export const fortsettSaksbehandling = () => {
  cy.findAllByRole('button').filter(':contains("Meny")').first().click()
  cy.findAllByRole('button', { name: /Fortsett behandling/i }).click()
}

export const taBrillesak = (saksbehandler: string = 'Silje Saksbehandler') => {
  console.log('Saksbehandler', saksbehandler)

  cy.findByTestId('select-bytt-bruker').select(saksbehandler)
  cy.findByTitle(/saksmeny/i).click()
  cy.findByRole('button', { name: /Ta saken/i }).click()
}
