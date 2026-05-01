import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message.includes('invalid-credential') ? 'Email oder Passwort falsch' : err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '16px'
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#000', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            🎒 Packliste
          </h1>
          <p style={{ color: '#999', fontSize: '15px', margin: 0 }}>
            Deine smarte Reise-Packliste
          </p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #F0F0F0',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 24px 0', color: '#000' }}>
            {isLogin ? 'Anmelden' : 'Registrieren'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1a1a1a',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#fff'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1a1a1a',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#fff'
                }}
              />
            </div>

            {error && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: '#CC0000' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Laden...' : (isLogin ? 'Anmelden' : 'Registrieren')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }}>
            {isLogin ? 'Noch kein Account?' : 'Bereits registriert?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer', fontWeight: '600', fontSize: '13px', padding: 0 }}
            >
              {isLogin ? 'Registrieren' : 'Anmelden'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#CCC' }}>
          💡 Tipp: Teile Email & Passwort mit deinem Partner für gemeinsamen Zugriff
        </p>
      </div>
    </div>
  )
}
