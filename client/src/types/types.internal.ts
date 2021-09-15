import { Dayjs } from 'dayjs'

export interface Sak {
    saksid: string
    søknadGjelder: string,
    hjelpemidler: Hjelpemiddel[]
    formidler: Formidler
    greitÅViteFaktum: GreitÅViteFaktum[]
    motattDato: string
    personinformasjon: Personinfo
    levering: Levering
    oppfølgingsansvarlig: Oppfølgingsansvarlig
    saksbehandler: Saksbehandler
    status: OppgaveStatusType
    vedtak: VedtakType
    enhet: Enhet[]
}

export interface VedtakType {
    vedtaksDato: string
    vedtaksStatus: VedtakStatusType
    saksbehandlerOid: string
    saksbehandlerNavn: string
    søknadsId: string
}

export interface Enhet {
    enhetsnummer: string
    enhetsnavn: string
}

export interface Oppfølgingsansvarlig {
    navn: string
    arbeidssted: string
    stilling: string
    telefon: string
    ansvarFor: string
}

export interface Levering {
    kontaktPerson?: KontaktPerson
    leveringsmåte: Leveringsmåte
    adresse?: string
    merknad?: string
}


export enum Leveringsmåte {
    FOLKEREGISTRERT_ADRESSE = 'FOLKEREGISTRERT_ADRESSE',
    ANNEN_ADRESSE = 'ANNEN_ADRESSE',
    HJELPEMIDDELSENTRAL = 'HJELPEMIDDELSENTRAL',
    ALLEREDE_LEVERT = 'ALLEREDE_LEVERT'
}

export interface KontaktPerson {
    navn: string,
    telefon: string,
    kontaktpersonType: KontaktPersonType
}

export enum KontaktPersonType {
    HJELPEMIDDELBRUKER = 'HJELPEMIDDELBRUKER',
    HJELPEMIDDELFORMIDLER = 'HJELPEMIDDELFORMIDLER',
    ANNEN_BRUKER = 'ANNEN_BRUKER'
}
export interface Hjelpemiddel {
    hmsnr: string,
    rangering: number
    utlevertFraHjelpemiddelsentralen: boolean
    utlevertInfo: UtlevertInfo
    antall: number
    kategori: string
    beskrivelse: string
    tilleggsinfo: Tilleggsinfo[]
    tilbehør: Tilbehør[]
}

export interface UtlevertInfo {
    annenKommentar: string
    overførtFraBruker: string
    utlevertType: UtlevertType
}

export enum UtlevertType {
    FremskuttLager = 'FremskuttLager',
    Korttidslån = 'Korttidslån',
    Overført = 'Overført',
    Annen = 'Annen'
}

export interface Tilleggsinfo {
    tittel: string
    innhold: string
}

export interface Tilbehør {
    hmsnr: string
    antall: number
    navn: string
}

export interface Formidler {
    navn: string
    poststed: string
    arbeidssted: string
    stilling: string
    postadresse: string
    telefon: string
    treffestEnklest: string
    epost: string
}

export interface GreitÅViteFaktum {
    beskrivelse: string
    type: GreitÅViteType
}

export enum GreitÅViteType {
    ADVARSEL = 'advarsel',
    INFO = 'info'
}

export interface Oppgave {
  opprettetDato: Dayjs
  mottattDato: string
  saksid: string
  personinformasjon: Personinfo
  status: OppgaveStatusType
  saksbehandler?: Saksbehandler
  søknadOm: string
}

export interface Saksbehandler {
    objectId: string
    epost: string
    navn: string
  }

export enum OppgaveStatusType {
  AVVENTER_SAKSBEHANDLER,
  SENDT_GOSYS,
  VEDTAK_FATTET,
}

export const OppgaveStatusLabel = new Map<number, string>([
  [OppgaveStatusType.AVVENTER_SAKSBEHANDLER, 'Avventer saksbehandler'],
  [OppgaveStatusType.SENDT_GOSYS, 'Sendt GOSYS'],
  [OppgaveStatusType.VEDTAK_FATTET, 'Vedtak Fattet'],
]);

export enum VedtakStatusType {
  INNVILGET
}

export const VedtakStatusLabel = new Map<number, string>([
  [VedtakStatusType.INNVILGET, 'Innvilget']
]);



export interface Error {
    message: string
    statusCode?: number
    technical?: string
  }

export enum Kjønn  {
    MANN = 'MANN',
    KVINNE = 'KVINNE',
    UKJENT = 'UKJENT'
}

export interface Personinfo {
  fornavn: string
  mellomnavn: string | null
  etternavn: string
  fødselsdato: string | undefined
  kjønn: Kjønn
  fnr: string
  brukernummer?: string
  adresse: string
  kilde: PersonInfoKilde
  signaturType: SignaturType
  telefon: string
  funksjonsnedsettelse: string[]
  bruksarena: Bruksarena
  bosituasjon: Bosituasjon
  postnummer: string
  poststed: string
  gtNummer: string
  gtType: string
  egenAnsatt: boolean
  brukerErDigital: boolean
  oppfylteVilkår: string[]
  kroppsmål?: Kroppsmål
}

export interface Kroppsmål {
    høyde: number
    kroppsvekt: number
    lårlengde: number
    legglengde: number
    setebredde: number
}

export enum Bruksarena {
    DAGLIGLIV = 'dagligliv'
}

export enum Bosituasjon {
    HJEMME = 'HJEMME',
    INSTITUSJON = 'INSITUSJON'
}

export enum SignaturType {
    SIGNATUR = 'signatur',
    BRUKER_BEKREFTER = 'bruker_bekrefter'
}

export enum PersonInfoKilde {
    PDL = 'pdl',
    MANUELL = 'manuell'
}

export enum Oppgavetype {
    Søknad = 'SØKNAD',
  }
