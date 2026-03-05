import { useState, useEffect } from 'react'
import { PopoverView } from './pages/PopoverView'
import { SettingsView } from './pages/SettingsView'

export function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return hash || '/popover'
  })

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.replace('#', '') || '/popover')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  switch (route) {
    case '/settings':
      return <SettingsView />
    case '/popover':
    default:
      return <PopoverView />
  }
}
