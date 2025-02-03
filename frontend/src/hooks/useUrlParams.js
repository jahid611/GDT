import { useState, useEffect } from "react"

export function useUrlParams() {
  const [params, setParams] = useState(new URLSearchParams(window.location.search))

  useEffect(() => {
    function handleUrlChange() {
      setParams(new URLSearchParams(window.location.search))
    }

    window.addEventListener("popstate", handleUrlChange)
    return () => window.removeEventListener("popstate", handleUrlChange)
  }, [])

  return params
}

