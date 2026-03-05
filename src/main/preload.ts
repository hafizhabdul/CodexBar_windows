import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('set-settings', settings),
  getSnapshots: () => ipcRenderer.invoke('get-snapshots'),
  refreshProvider: (id: string) => ipcRenderer.invoke('refresh-provider', id),
  refreshAll: () => ipcRenderer.invoke('refresh-all'),
  getSecret: (key: string) => ipcRenderer.invoke('get-secret', key),
  setSecret: (key: string, value: string) => ipcRenderer.invoke('set-secret', key, value),
  deleteSecret: (key: string) => ipcRenderer.invoke('delete-secret', key),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  getProviderList: () => ipcRenderer.invoke('get-provider-list'),
  onSnapshotsUpdated: (callback: (snapshots: unknown[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshots: unknown[]) => callback(snapshots)
    ipcRenderer.on('snapshots-updated', handler)
    return () => ipcRenderer.removeListener('snapshots-updated', handler)
  },
}

contextBridge.exposeInMainWorld('codexbar', api)
