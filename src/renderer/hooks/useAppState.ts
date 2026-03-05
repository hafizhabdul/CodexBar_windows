import { useState, useEffect, useCallback } from 'react'
import type { AppSettings, UsageSnapshot, ProviderInfo } from '../../shared/types'

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<UsageSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    window.codexbar.getSnapshots().then((data) => {
      setSnapshots(data)
      setLoading(false)
    })

    // Subscribe to updates
    const unsub = window.codexbar.onSnapshotsUpdated((data) => {
      setSnapshots(data as UsageSnapshot[])
      setLoading(false)
    })

    return unsub
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await window.codexbar.refreshAll()
  }, [])

  const refreshProvider = useCallback(async (id: string) => {
    await window.codexbar.refreshProvider(id)
  }, [])

  return { snapshots, loading, refresh, refreshProvider }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    window.codexbar.getSettings().then(setSettings)
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    await window.codexbar.setSettings(partial)
    const updated = await window.codexbar.getSettings()
    setSettings(updated)
  }, [])

  return { settings, updateSettings }
}

export function useProviders() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])

  useEffect(() => {
    window.codexbar.getProviderList().then(setProviders)
  }, [])

  return providers
}
