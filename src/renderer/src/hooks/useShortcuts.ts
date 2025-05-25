import { useContext } from 'react'
import { ShortcutContext, type ShortcutContextType } from '../contexts/shortcut-context'

export function useShortcuts(): ShortcutContextType {
  const context = useContext(ShortcutContext)
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider')
  }
  return context
}
