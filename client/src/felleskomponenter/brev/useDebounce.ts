import { useEffect, useState } from 'react'

export function useDebounce(data: string, callback: (value: string) => void) {
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined)
  const debounceVentetid = 1000

  useEffect(() => {
    if (timer) {
      clearTimeout(timer)
    }

    const newTimer = setTimeout(() => {
      callback(data)
    }, debounceVentetid)

    setTimer(newTimer)

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [data, callback])
}
