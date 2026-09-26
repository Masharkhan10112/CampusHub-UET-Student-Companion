import { useCallback, useEffect, useRef, useState } from 'react'

import { getErrorMessage } from '@/lib/errors'

/**
 * Minimal data-fetching hook: runs `loader` on mount (and whenever `deps`
 * change), tracks loading/error state, and exposes `reload` plus a local
 * `setData` so mutations can update the list without a round trip.
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loaderRef.current())
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps)

  useEffect(() => {
    void run()
  }, [run])

  return { data, loading, error, reload: run, setData }
}
