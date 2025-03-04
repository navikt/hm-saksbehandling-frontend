import Dexie, { Table } from 'dexie'

import {
  Barnebrillesak,
  Brevkode,
  BrevTekst,
  Hendelse,
  JournalføringRequest,
  Kjønn,
  MålformType,
  Notat,
  OppdaterVilkårRequest,
  Oppgave,
  OppgaveStatusLabel,
  OppgaveStatusType,
  Saksdokument,
  SaksdokumentType,
  Sakstype,
  StegType,
  Totrinnskontroll,
  TotrinnskontrollData,
  TotrinnskontrollVurdering,
  Utbetalingsmottaker,
  VedtakStatusType,
  Vilkår,
  Vilkårsgrunnlag,
  VilkårsResultat,
  Vilkårsvurdering,
  VurderVilkårRequest,
} from '../../types/types.internal'
import { IdGenerator } from './IdGenerator'
import { JournalpostStore } from './JournalpostStore'
import { PersonStore } from './PersonStore'
import { SaksbehandlerStore } from './SaksbehandlerStore'
import { beregnSats } from './beregnSats'
import { lagTilfeldigBosted } from './bosted'
import { enheter } from './enheter'
import { lagTilfeldigFødselsdato, lagTilfeldigTelefonnummer } from './felles'
import { lagTilfeldigFødselsnummer } from './fødselsnummer'
import { lagTilfeldigNavn } from './navn'
import { vurderteVilkår } from './vurderteVilkår'
import { formaterNavn } from '../../utils/formater'
import { formatISO } from 'date-fns'

type LagretBarnebrillesak = Omit<Barnebrillesak, 'vilkårsgrunnlag' | 'vilkårsvurdering'>
type LagretVilkårsgrunnlag = Vilkårsgrunnlag
type LagretVilkårsvurdering = Omit<Vilkårsvurdering, 'vilkår'>

export interface LagretVilkår extends Vilkår {
  vilkårsvurderingId: string
}

interface LagretHendelse extends Hendelse {
  sakId: string
}

function lagVilkårsgrunnlag(sakId: string, vurderVilkårRequest: VurderVilkårRequest): LagretVilkårsgrunnlag {
  return {
    data: { ...vurderVilkårRequest.data },
    sakId,
    sakstype: vurderVilkårRequest.sakstype,
    målform: vurderVilkårRequest.målform,
  }
}

function lagVilkårsvurdering(sakId: string, vurderVilkårRequest: VurderVilkårRequest): LagretVilkårsvurdering {
  if (vurderVilkårRequest.data) {
    const { brillepris, brilleseddel } = vurderVilkårRequest.data
    const { sats, satsBeløp, satsBeskrivelse, beløp } = beregnSats(brilleseddel, brillepris)

    return {
      id: sakId,
      sakId,
      resultat: VilkårsResultat.JA,
      data: {
        sats,
        satsBeløp,
        satsBeskrivelse,
        beløp,
      },
      opprettet: new Date().toISOString(),
    }
  } else {
    throw new Error('Noe er feil med VurderVilkårRequest-payload i lagVilkårsvurdering()')
  }
}

function lagVilkår(
  vilkårsvurderingId: string,
  vurderVilkårRequest: VurderVilkårRequest
): Array<Omit<LagretVilkår, 'id'>> {
  const { bestillingsdato, brilleseddel, bestiltHosOptiker, komplettBrille, kjøptBrille } = vurderVilkårRequest.data!

  return vurderteVilkår(
    vilkårsvurderingId,
    brilleseddel!,
    komplettBrille!,
    bestiltHosOptiker,
    kjøptBrille,
    bestillingsdato
  )
}

function lagBarnebrillesak(sakId: number): LagretBarnebrillesak {
  const fødselsdatoBruker = lagTilfeldigFødselsdato(10)
  const now = new Date().toISOString()
  return {
    sakId: sakId.toString(),
    sakstype: Sakstype.BARNEBRILLER,
    status: OppgaveStatusType.AVVENTER_SAKSBEHANDLER,
    statusEndret: now,
    opprettet: now,
    søknadGjelder: 'Briller til barn',
    bruker: {
      fnr: lagTilfeldigFødselsnummer(fødselsdatoBruker),
      navn: lagTilfeldigNavn(),
      fødselsdato: formatISO(fødselsdatoBruker, { representation: 'date' }),
      kommune: {
        nummer: '9999',
        navn: lagTilfeldigBosted(),
      },
      telefon: lagTilfeldigTelefonnummer(),
      kontonummer: '11111111113',
      adressebeskyttelseOgSkjerming: {
        gradering: [],
        skjermet: false,
      },
    },
    innsender: {
      fnr: lagTilfeldigFødselsnummer(42),
      navn: lagTilfeldigNavn().fulltNavn,
      adressebeskyttelseOgSkjerming: {
        gradering: [],
        skjermet: false,
      },
    },
    enhet: enheter.oslo,
    steg: StegType.INNHENTE_FAKTA,
    journalposter: [],
  }
}

export class BarnebrillesakStore extends Dexie {
  private readonly saker!: Table<LagretBarnebrillesak, string>
  private readonly vilkårsgrunnlag!: Table<LagretVilkårsgrunnlag, string>
  private readonly vilkårsvurderinger!: Table<LagretVilkårsvurdering, string>
  private readonly vilkår!: Table<LagretVilkår, number>
  private readonly hendelser!: Table<LagretHendelse, string>
  private readonly notater!: Table<Omit<Notat, 'id'>, number>
  private readonly brevtekst!: Table<BrevTekst, string>
  private readonly saksdokumenter!: Table<Saksdokument, string>

  constructor(
    private readonly idGenerator: IdGenerator,
    private readonly saksbehandlerStore: SaksbehandlerStore,
    private readonly personStore: PersonStore,
    private readonly journalpostStore: JournalpostStore
  ) {
    super('BarnebrillesakStore')
    this.version(1).stores({
      saker: 'sakId',
      vilkårsgrunnlag: 'sakId',
      vilkårsvurderinger: 'id,sakId',
      vilkår: '++id,vilkårsvurderingId',
      hendelser: '++id,sakId',
      notater: '++id,sakId',
      brevtekst: 'sakId',
      saksdokumenter: '++id,sakId',
    })
  }

  async populer() {
    const count = await this.saker.count()
    if (count !== 0) {
      return []
    }
    const lagBarnebrillesakMedId = () => lagBarnebrillesak(this.idGenerator.nesteId())

    return this.lagreAlle([
      lagBarnebrillesakMedId(),
      lagBarnebrillesakMedId(),
      lagBarnebrillesakMedId(),
      lagBarnebrillesakMedId(),
      lagBarnebrillesakMedId(),
      lagBarnebrillesak(1111),
      lagBarnebrillesakMedId(),
      lagBarnebrillesakMedId(),
      lagBarnebrillesakMedId(),
    ])
  }

  async lagreAlle(saker: LagretBarnebrillesak[]) {
    const journalposter = await this.journalpostStore.alle()
    await this.personStore.lagreAlle(
      saker.map(({ bruker: { navn, kjønn, ...rest } }) => ({
        ...navn,
        ...rest,
        navn,
        kjønn: kjønn || Kjønn.UKJENT,
        enhet: enheter.agder,
      }))
    )
    return this.saker.bulkAdd(
      saker.map((sak) => ({
        ...sak,
        journalposter: [journalposter[0].journalpostId],
      })),
      { allKeys: true }
    )
  }

  async alle() {
    return this.saker.toArray()
  }

  async oppgaver() {
    const saker = await this.alle()
    return saker.map<Oppgave>(({ bruker, ...sak }) => ({
      sakId: sak.sakId,
      sakstype: Sakstype.TILSKUDD,
      status: sak.status,
      statusEndret: sak.statusEndret,
      beskrivelse: sak.søknadGjelder,
      mottatt: sak.opprettet,
      innsender: formaterNavn(sak.innsender.navn),
      bruker: {
        fnr: bruker.fnr,
        funksjonsnedsettelser: ['syn'],
        bosted: bruker.kommune.navn,
        ...bruker.navn,
      },
      enhet: sak.enhet,
      saksbehandler: sak.saksbehandler,
      kanTildeles: true,
    }))
  }

  async hent(sakId: string): Promise<Barnebrillesak | undefined> {
    const sak = await this.saker.get(sakId)
    if (!sak) {
      return
    }
    const vilkårsgrunnlag = await this.vilkårsgrunnlag.get(sakId)
    const vilkårsvurdering = await this.vilkårsvurderinger.where('sakId').equals(sakId).first()
    if (vilkårsvurdering) {
      const vilkår = await this.vilkår.where('vilkårsvurderingId').equals(vilkårsvurdering.id).toArray()

      const { resultat, ...rest } = vilkårsvurdering

      const samletVurdering = this.beregnSamletVurdering(vilkår)

      return {
        ...sak,
        vilkårsgrunnlag,
        vilkårsvurdering: {
          resultat: samletVurdering,
          ...rest,
          vilkår,
        },
      }
    }
    return sak
  }

  async lagreHendelse(sakId: string, hendelse: string, detaljer?: string, noenAndre: boolean = false) {
    let { navn: bruker } = await this.saksbehandlerStore.innloggetSaksbehandler()
    if (noenAndre) {
      const { navn: annenBruker } = await this.saksbehandlerStore.ikkeInnloggetSaksbehandler()
      bruker = annenBruker
    }
    return this.hendelser.put({
      id: this.idGenerator.nesteId().toString(),
      opprettet: new Date().toISOString(),
      sakId,
      hendelse,
      detaljer,
      bruker,
    })
  }

  async hentHendelser(sakId: string) {
    return this.hendelser.where('sakId').equals(sakId).toArray()
  }

  async tildel(sakId: string, noenAndre: boolean = false) {
    const sak = await this.hent(sakId)
    if (!sak) {
      return false
    }
    let saksbehandler = await this.saksbehandlerStore.innloggetSaksbehandler()
    if (noenAndre) {
      saksbehandler = await this.saksbehandlerStore.ikkeInnloggetSaksbehandler()
    }
    this.transaction('rw', this.saker, this.hendelser, () => {
      this.saker.update(sakId, {
        saksbehandler: saksbehandler,
        status: OppgaveStatusType.TILDELT_SAKSBEHANDLER,
      })
      this.lagreHendelse(sakId, 'Saksbehandler har tatt saken', undefined, noenAndre)
    })
    return true
  }

  async frigi(sakId: string) {
    const sak = await this.hent(sakId)
    if (!sak) {
      return false
    }
    this.transaction('rw', this.saker, this.hendelser, () => {
      this.saker.update(sakId, {
        saksbehandler: undefined,
        status: OppgaveStatusType.AVVENTER_SAKSBEHANDLER,
      })
      this.lagreHendelse(sakId, 'Saksbehandler er meldt av saken')
    })
    return true
  }

  async oppdaterSteg(sakId: string, steg: StegType) {
    return this.saker.update(sakId, {
      steg,
    })
  }

  async oppdaterStatus(sakId: string, status: OppgaveStatusType) {
    const sak = await this.hent(sakId)
    if (!sak) {
      return false
    }

    if (sak.status === status) {
      return false
    } else {
      this.transaction('rw', this.saker, this.hendelser, () => {
        this.saker.update(sakId, {
          status: status,
        })
        this.lagreHendelse(sakId, `Saksstatus endret: ${OppgaveStatusLabel.get(status)}`)
        this.lagreHendelse(sakId, 'Brev sendt', 'Innhente opplysninger')
      })
      return true
    }
  }

  beregnSamletVurdering(vilkår: Array<Omit<LagretVilkår, 'id'>>) {
    const samletVurdering = vilkår
      .map((v) => v.vilkårOppfylt)
      .reduce((samletStatus, vilkårOppfylt) => {
        if (samletStatus === VilkårsResultat.KANSKJE || samletStatus === VilkårsResultat.NEI) {
          return samletStatus
        } else if (vilkårOppfylt === VilkårsResultat.NEI || vilkårOppfylt === VilkårsResultat.KANSKJE) {
          return vilkårOppfylt
        } else if (vilkårOppfylt === VilkårsResultat.OPPLYSNINGER_MANGLER) {
          return VilkårsResultat.NEI
        } else {
          return samletStatus
        }
      }, VilkårsResultat.JA)

    if (!samletVurdering) {
      throw Error('Feil med utledning av samlet status')
    }

    return samletVurdering
  }

  async oppdaterUtbetalingsmottaker(sakId: string, fnr: string): Promise<Utbetalingsmottaker> {
    const utbetalingsmottaker: Utbetalingsmottaker = {
      fnr,
      navn: lagTilfeldigNavn().fulltNavn,
      kontonummer: '11111111113',
    }
    await this.saker.update(sakId, {
      utbetalingsmottaker,
    })
    return utbetalingsmottaker
  }

  async vurderVilkår(sakId: string, vurderVilkårRequest: VurderVilkårRequest) {
    return this.transaction('rw', this.saker, this.vilkårsgrunnlag, this.vilkårsvurderinger, this.vilkår, async () => {
      const vilkårsgrunnlag = lagVilkårsgrunnlag(sakId, vurderVilkårRequest)

      await this.vilkårsgrunnlag.put(vilkårsgrunnlag, sakId)
      const vilkårsvurdering = lagVilkårsvurdering(sakId, vurderVilkårRequest)

      const vilkårsvurderingId = await this.vilkårsvurderinger.put(vilkårsvurdering)
      const vilkår = lagVilkår(vilkårsvurderingId, vurderVilkårRequest)

      const samletVurdering = this.beregnSamletVurdering(vilkår)
      vilkårsvurdering.resultat = samletVurdering

      await this.vilkårsvurderinger.update(vilkårsvurderingId, vilkårsvurdering)

      await this.vilkår.where('vilkårsvurderingId').equals(vilkårsvurdering.id).delete()
      await this.vilkår.bulkAdd(vilkår as any, { allKeys: true }) // fixme
      await this.oppdaterStatus(sakId, OppgaveStatusType.TILDELT_SAKSBEHANDLER)
      return this.oppdaterSteg(sakId, StegType.VURDERE_VILKÅR)
    })
  }

  // TODO se på payload for overstyring av vilkår
  async oppdaterVilkår(
    vilkårId: number | string,
    { resultatSaksbehandler, begrunnelseSaksbehandler }: OppdaterVilkårRequest
  ) {
    vilkårId = Number(vilkårId)

    return this.vilkår.update(vilkårId, {
      manuellVurdering: {
        vilkårOppfylt: resultatSaksbehandler,
        begrunnelse: begrunnelseSaksbehandler,
      },
      vilkårOppfylt: resultatSaksbehandler,
    })
  }

  async sendTilGodkjenning(sakId: string) {
    const saksbehandler = await this.saksbehandlerStore.innloggetSaksbehandler()
    const totrinnskontroll: Totrinnskontroll = {
      saksbehandler,
      opprettet: new Date().toISOString(),
    }

    return this.transaction('rw', this.saker, this.hendelser, () => {
      this.saker.update(sakId, {
        saksbehandler: undefined,
        steg: StegType.GODKJENNE,
        status: OppgaveStatusType.AVVENTER_GODKJENNER,
        totrinnskontroll,
      })
      this.lagreHendelse(sakId, 'Sak sendt til godkjenning')
    })
  }

  async ferdigstillTotrinnskontroll(sakId: string, { resultat, begrunnelse }: TotrinnskontrollData) {
    const nå = new Date().toISOString()
    const sak = await this.hent(sakId)
    if (!sak || !sak.totrinnskontroll) {
      return Promise.reject('noe gikk galt')
    }

    const lagretTotrinnskontroll = sak.totrinnskontroll
    const godkjenner = await this.saksbehandlerStore.innloggetSaksbehandler()
    return this.transaction('rw', this.saker, this.hendelser, () => {
      if (resultat === TotrinnskontrollVurdering.GODKJENT) {
        const totrinnskontroll: Partial<Totrinnskontroll> = {
          ...lagretTotrinnskontroll,
          godkjenner,
          resultat,
          begrunnelse,
          godkjent: nå,
        }
        this.saker.update(sakId, {
          saksbehandler: totrinnskontroll.saksbehandler,
          steg: StegType.FERDIG_BEHANDLET,
          status: OppgaveStatusType.VEDTAK_FATTET,
          vedtak: {
            vedtaksdato: nå,
            status: sak.vilkårsvurdering?.resultat === 'JA' ? VedtakStatusType.INNVILGET : VedtakStatusType.AVSLÅTT,
            saksbehandlerNavn: sak.saksbehandler?.navn || '',
            saksbehandlerRef: sak.saksbehandler?.id || '',
            soknadUuid: '',
          },
          totrinnskontroll,
        } as any) // fixme
        this.lagreHendelse(sakId, 'Vedtak fattet')
      }

      if (resultat === TotrinnskontrollVurdering.RETURNERT) {
        const totrinnskontroll: Partial<Totrinnskontroll> = {
          ...lagretTotrinnskontroll,
          godkjenner,
          resultat,
          begrunnelse,
        }
        this.saker.update(sakId, {
          saksbehandler: totrinnskontroll.saksbehandler,
          steg: StegType.REVURDERE,
          status: OppgaveStatusType.TILDELT_SAKSBEHANDLER,
          totrinnskontroll,
        } as any) // fixme
        this.lagreHendelse(sakId, 'Sak returnert til saksbehandler')
      }
    })
  }

  async opprettSak(journalføring: JournalføringRequest) {
    const sak = lagBarnebrillesak(this.idGenerator.nesteId())
    sak.bruker.fnr = journalføring.journalføresPåFnr
    sak.journalposter = [journalføring.journalpostId]
    return this.saker.add(sak)
  }

  async knyttJournalpostTilSak(journalføring: JournalføringRequest) {
    const sakId = journalføring.sakId

    if (!sakId) {
      return
    }

    const eksisterendeSak = await this.saker.get(sakId)

    if (!eksisterendeSak) {
      return
    }

    const eksisterendeJournalposter = eksisterendeSak.journalposter
    this.saker.update(sakId, { journalposter: [...eksisterendeJournalposter, journalføring.journalpostId] })
  }

  async lagreNotat(sakId: string, type: 'INTERNT', innhold: string) {
    const saksbehandler = await this.saksbehandlerStore.innloggetSaksbehandler()
    return this.notater.add({
      sakId,
      saksbehandler,
      type,
      innhold,
      opprettet: new Date().toISOString(),
    })
  }

  async slettNotat(notatId: number) {
    return this.notater.delete(notatId)
  }

  async hentNotater(sakId: string) {
    return this.notater.where('sakId').equals(sakId).toArray()
  }

  async lagreBrevtekst(sakId: string, brevtype: string, data: any) {
    this.brevtekst.put({ brevtype, målform: MålformType.BOKMÅL, data: data, sakId }, sakId)
  }

  async fjernBrevtekst(sakId: string) {
    this.brevtekst.delete(sakId)
  }

  async hentBrevtekst(sakId: string) {
    return this.brevtekst.where('sakId').equals(sakId).first()
  }

  async hentSaksdokumenter(sakId: string /*, dokumentType: string*/) {
    // TODO filterer på dokumenttype også
    return this.saksdokumenter.where('sakId').equals(sakId).toArray()
  }

  async lagreSaksdokument(sakId: string, tittel: string) {
    const saksbehandler = await this.saksbehandlerStore.innloggetSaksbehandler()
    const dokumentId = (await this.saksdokumenter.count()) + 1
    this.saksdokumenter.add({
      sakId: sakId,
      journalpostId: '12345678',
      type: SaksdokumentType.UTGÅENDE,
      brevkode: Brevkode.INNHENTE_OPPLYSNINGER_BARNEBRILLER,
      opprettet: new Date().toISOString(),
      saksbehandler: saksbehandler,
      dokumentId: dokumentId.toString(),
      tittel: tittel,
    })
  }
}
