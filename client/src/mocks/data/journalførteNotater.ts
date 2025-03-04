export function hentJournalførteNotater(sakId: string) {
  return [
    {
      brevkode: 'Nav 10.01.01',
      dokumentId: '6',
      harOrignalTekst: true,
      journalpostId: 'jpostid1001',
      opprettet: '2025-02-24T12:34:27.308680Z',
      originalTekst: {
        dokumenttittel: 'Bekreftelse av medlemskap',
        brevtekst:
          'Bekreftelse av medlemskap gjennomført ved sjekk av andre goder i Gosys.\n\n' +
          '**Jajamensann:**\n\nHallo <u>markdown</u>!\n\n*Lister:*\n\n* Punktliste 1\n* Punktliste 2\n\n' +
          '1. Nummerliste 1\n2. Nummerliste 2\n\n* [x] Sjekkliste 1\n* [ ] Sjekkliste 2',
      },
      sakId: sakId,
      saksbehandler: {
        epost: '',
        id: 'X999999',
        navn: 'Sak Saksbehandler',
      },
      saksbehandlerId: 'X999999',
      status: 'TODO',
      tittel: 'Bekreftelse av medlemskap',
      type: 'NOTAT',
    },
    {
      brevkode: 'Nav 10.01.01',
      dokumentId: '6',
      harOrignalTekst: false,
      journalpostId: 'jpostid1002',
      opprettet: '2025-02-22T10:52:17.308680Z',
      sakId: sakId,
      saksbehandler: {
        epost: '',
        id: 'X999999',
        navn: 'Sak Saksbehandler',
      },
      saksbehandlerId: 'X999999',
      status: 'TODO',
      tittel: 'Møte med bruker',
      type: 'NOTAT',
    },
    {
      brevkode: 'Nav 10.01.01',
      dokumentId: '6',
      harOrignalTekst: true,
      journalpostId: 'jpostid1003',
      opprettet: '2025-02-23T15:13:42.308680Z',
      originalTekst: {
        dokumenttittel: 'Utredelse fra lege',
        brevtekst:
          '**Utredelse fra lege:**\nLorem ipsum dolor sit amet.\n\n**Noe annet:**\nLorem ipsum dolor sit amet.',
      },
      sakId: sakId,
      saksbehandler: {
        epost: '',
        id: 'X999999',
        navn: 'Sak Saksbehandler',
      },
      saksbehandlerId: 'X999999',
      status: 'TODO',
      tittel: 'Utredelse fra lege',
      type: 'NOTAT',
    },
  ]
}
