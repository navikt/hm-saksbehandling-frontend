import { useState } from 'react'

//import { useErrorHandler } from 'react-error-boundary'
import { HttpError } from './error'

export interface Resultat<T> {
  data?: T
  error?: HttpError
  loading?: boolean
}

export function usePost<B, T>(url: string): { post(body: B): Promise<void>; reset(): void } & Resultat<T> {
  const [[resultat, loading], setResultat] = useState<[Resultat<T>, boolean]>([{}, false])
  //useErrorHandler(resultat.error)
  return {
    async post(body) {
      setResultat([{}, true])
      const resultat = await http.post<B, T>(url, body)
      setResultat([resultat, false])
    },
    reset() {
      setResultat([{}, false])
    },
    ...resultat,
    loading,
  }
}

export const http = {
  async post<B, T>(path: string, body: B): Promise<Resultat<T>> {
    try {
      const response = await fetch(path, {
        method: 'post',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        const data = await response.json()
        return { data }
      }
      return {
        error: HttpError.kallFeilet(path, response),
      }
    } catch (err: unknown) {
      return {
        error: HttpError.wrap(err),
      }
    }
  },
}

export function apiUrl(url: string) {
  return `/api${url}`
}
