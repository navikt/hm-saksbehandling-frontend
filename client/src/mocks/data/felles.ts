import { addDays, getDaysInMonth, setDate, subYears } from 'date-fns'

export function tilfeldigInnslag<T>(array: T[]): T {
  return array[lagTilfeldigInteger(0, array.length - 1)]
}

export function lagUUID(): string {
  return crypto.randomUUID()
}

export function lagTilfeldigInteger(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function lagTilfeldigDato(år: number): Date {
  const d = new Date(år, lagTilfeldigInteger(0, 11), 1)
  const date = lagTilfeldigInteger(1, getDaysInMonth(d))
  return setDate(d, date)
}

export function lagTilfeldigFødselsdato(alder: number): Date {
  return addDays(subYears(new Date(), alder), lagTilfeldigInteger(1, 365) - 1)
}

export function lagTilfeldigTelefonnummer(): string {
  return lagTilfeldigInteger(1, 99_999_999).toString().padEnd(8, '0')
}

export async function lastDokumentBarnebriller(navn: string): Promise<ArrayBuffer> {
  const dokument = await import(`./barnebriller_${navn}.pdf`)
  const response = await fetch(dokument.default)
  return response.arrayBuffer()
}

export async function lastDokument(navn: string): Promise<ArrayBuffer> {
  const dokument = await import(`./${navn}.pdf`)
  const response = await fetch(dokument.default)
  return response.arrayBuffer()
}
