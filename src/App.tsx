import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import TripView from './components/TripView'
import SharedView from './components/SharedView'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentTripId, setCurrentTripId] = useState<string | null>(null)

  // Check if shared link
  const path = window.location.pathname
  const sharedMatch = path.match(/^\/shared\/(.+)$/)
  if (sharedMatch) {
    return <SharedView shareId={sharedMatch[1]} />
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, sans-serif', color: '#999', fontSize: '14px'
      }}>
        Laden...
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (currentTripId) {
    return (
      <TripView
        tripId={currentTripId}
        onBack={() => setCurrentTripId(null)}
      />
    )
  }

  return <Dashboard onSelectTrip={setCurrentTripId} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
