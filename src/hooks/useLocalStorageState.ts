import * as React from "react"

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Ignore storage write errors.
    }
  }, [key, state])

  return [state, setState] as const
}
