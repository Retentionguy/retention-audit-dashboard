import { create } from 'zustand'
import { Alert } from '../types'
import alertsData from '../data/alerts.json'

interface AppState {
  isAuthenticated: boolean
  user: { name: string; agency: string; email: string } | null
  login: (email: string, password: string) => boolean
  logout: () => void
  alerts: Alert[]
  unreadCount: number
  markAlertRead: (id: string) => void
  markAllRead: () => void
  activeSignalCountry: string
  setActiveSignalCountry: (c: string) => void
  clientSearch: string
  setClientSearch: (s: string) => void
  clientStatusFilter: string
  setClientStatusFilter: (s: string) => void
  clientSourceFilter: string
  setClientSourceFilter: (s: string) => void
  clientDestFilter: string
  setClientDestFilter: (s: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,

  login: (email, password) => {
    if (email === 'agent@edios.io' && password === 'demo123') {
      set({
        isAuthenticated: true,
        user: { name: 'Alex Chen', agency: 'Pacific Gateway Education', email }
      })
      return true
    }
    return false
  },

  logout: () => set({ isAuthenticated: false, user: null }),

  alerts: alertsData as Alert[],
  unreadCount: (alertsData as Alert[]).filter(a => !a.read).length,

  markAlertRead: (id) => set(state => {
    const updated = state.alerts.map(a => a.id === id ? { ...a, read: true } : a)
    return { alerts: updated, unreadCount: updated.filter(a => !a.read).length }
  }),

  markAllRead: () => set(state => ({
    alerts: state.alerts.map(a => ({ ...a, read: true })),
    unreadCount: 0
  })),

  activeSignalCountry: 'Australia',
  setActiveSignalCountry: (c) => set({ activeSignalCountry: c }),

  clientSearch: '',
  setClientSearch: (s) => set({ clientSearch: s }),
  clientStatusFilter: 'All',
  setClientStatusFilter: (s) => set({ clientStatusFilter: s }),
  clientSourceFilter: 'All',
  setClientSourceFilter: (s) => set({ clientSourceFilter: s }),
  clientDestFilter: 'All',
  setClientDestFilter: (s) => set({ clientDestFilter: s }),
}))
