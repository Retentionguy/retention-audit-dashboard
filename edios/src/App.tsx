import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VisaSignals from './pages/VisaSignals'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import SourceMarkets from './pages/SourceMarkets'
import Alerts from './pages/Alerts'
import PageShell from './components/layout/PageShell'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><PageShell /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="visa-signals" element={<VisaSignals />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="source-markets" element={<SourceMarkets />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
