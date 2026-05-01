import { useState, useEffect } from 'react'
import { ref, onValue, push, remove } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Trip, SavedList } from '../types'
import { Plus, Trash2, LogOut, List, Map } from 'lucide-react'

interface DashboardProps {
  onSelectTrip: (tripId: string) => void
}

export default function Dashboard({ onSelectTrip }: DashboardProps) {
  const { user, logout } = useAuth()
  const [trips, setTrips] = useState<{ [key: string]: Trip }>({})
  const [savedLists, setSavedLists] = useState<{ [key: string]: SavedList }>({})
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [newTrip, setNewTrip] = useState({ name: '', location: 'Basel', startDate: '', endDate: '' })
  const [activeTab, setActiveTab] = useState<'trips' | 'lists'>('trips')

  useEffect(() => {
    if (!user) return
    const tripsRef = ref(db, `users/${user.uid}/trips`)
    const unsubTrips = onValue(tripsRef, snap => {
      setTrips(snap.val() || {})
    })
    const listsRef = ref(db, `users/${user.uid}/lists`)
    const unsubLists = onValue(listsRef, snap => {
      setSavedLists(snap.val() || {})
    })
    return () => { unsubTrips(); unsubLists() }
  }, [user])

  const createTrip = async () => {
    if (!user || !newTrip.name || !newTrip.startDate || !newTrip.endDate) return
    const tripsRef = ref(db, `users/${user.uid}/trips`)
    const trip: Omit<Trip, 'id'> = {
      name: newTrip.name,
      location: newTrip.location,
      startDate: newTrip.startDate,
      endDate: newTrip.endDate,
      weightTracking: false,
      persons: ['A', 'B'],
      categories: {
        cat1: { id: 'cat1', name: 'Kleidung', items: {} },
        cat2: { id: 'cat2', name: 'Elektronik', items: {} },
        cat3: { id: 'cat3', name: 'Hygiene', items: {} },
        cat4: { id: 'cat4', name: 'Dokumente', items: {} },
      },
      createdAt: Date.now()
    }
    const newRef = await push(tripsRef, trip)
    setShowNewTrip(false)
    setNewTrip({ name: '', location: 'Basel', startDate: '', endDate: '' })
    if (newRef.key) onSelectTrip(newRef.key)
  }

  const deleteTrip = async (tripId: string) => {
    if (!user || !confirm('Reise wirklich löschen?')) return
    await remove(ref(db, `users/${user.uid}/trips/${tripId}`))
  }

  const deleteList = async (listId: string) => {
    if (!user || !confirm('Liste wirklich löschen?')) return
    await remove(ref(db, `users/${user.uid}/lists/${listId}`))
  }

  const loadListAsTrip = async (list: SavedList) => {
    if (!user) return
    const tripsRef = ref(db, `users/${user.uid}/trips`)
    const trip: Omit<Trip, 'id'> = {
      name: list.name,
      location: 'Basel',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weightTracking: false,
      persons: ['A', 'B'],
      categories: list.categories,
      createdAt: Date.now()
    }
    const newRef = await push(tripsRef, trip)
    if (newRef.key) onSelectTrip(newRef.key)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '16px',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingTop: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#000', letterSpacing: '-0.5px' }}>🎒 Packliste</h1>
        <button onClick={logout} style={{ background: '#F5F5F5', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
          <LogOut size={18} color="#666" />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('trips')}
          style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
            background: activeTab === 'trips' ? '#8B5CF6' : '#F5F5F5',
            color: activeTab === 'trips' ? 'white' : '#333',
            fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Map size={14} /> Reisen
        </button>
        <button
          onClick={() => setActiveTab('lists')}
          style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
            background: activeTab === 'lists' ? '#8B5CF6' : '#F5F5F5',
            color: activeTab === 'lists' ? 'white' : '#333',
            fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <List size={14} /> Meine Listen
        </button>
      </div>

      {/* TRIPS TAB */}
      {activeTab === 'trips' && (
        <>
          {Object.entries(trips).map(([id, trip]) => (
            <div
              key={id}
              style={{
                background: '#fff', border: '1px solid #F0F0F0', borderRadius: '12px',
                padding: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelectTrip(id)}>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#000', marginBottom: '4px' }}>{trip.name}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  📍 {trip.location} · {trip.startDate} – {trip.endDate}
                </div>
              </div>
              <button onClick={() => deleteTrip(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <Trash2 size={16} color="#CCC" />
              </button>
            </div>
          ))}

          {!showNewTrip ? (
            <button
              onClick={() => setShowNewTrip(true)}
              style={{
                width: '100%', padding: '14px', background: '#fff',
                border: '2px dashed #8B5CF6', borderRadius: '12px',
                color: '#8B5CF6', fontWeight: '600', fontSize: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Plus size={18} /> Neue Reise
            </button>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #F0F0F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#000' }}>Neue Reise</h3>
              {[
                { label: 'Reisename', key: 'name', type: 'text', placeholder: 'z.B. Alpentourer' },
                { label: 'Ort', key: 'location', type: 'text', placeholder: 'z.B. Basel' },
                { label: 'Von', key: 'startDate', type: 'date', placeholder: '' },
                { label: 'Bis', key: 'endDate', type: 'date', placeholder: '' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={newTrip[field.key as keyof typeof newTrip]}
                    onChange={e => setNewTrip({ ...newTrip, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '9px 12px', border: '1px solid #E0E0E0',
                      borderRadius: '8px', fontSize: '13px', color: '#1a1a1a',
                      boxSizing: 'border-box', background: '#fff', outline: 'none'
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => setShowNewTrip(false)} style={{ flex: 1, padding: '10px', background: '#F5F5F5', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#333', fontWeight: '500' }}>
                  Abbrechen
                </button>
                <button onClick={createTrip} style={{ flex: 1, padding: '10px', background: '#8B5CF6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: 'white', fontWeight: '600' }}>
                  Erstellen
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* LISTS TAB */}
      {activeTab === 'lists' && (
        <>
          {Object.keys(savedLists).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#CCC', fontSize: '14px' }}>
              Noch keine Listen gespeichert.<br />
              <span style={{ fontSize: '12px' }}>Speichere eine Packliste als Liste für spätere Reisen.</span>
            </div>
          )}
          {Object.entries(savedLists).map(([id, list]) => (
            <div
              key={id}
              style={{
                background: '#fff', border: '1px solid #F0F0F0', borderRadius: '12px',
                padding: '16px', marginBottom: '10px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#000', marginBottom: '4px' }}>{list.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {Object.keys(list.categories || {}).length} Kategorien · {new Date(list.createdAt).toLocaleDateString('de-CH')}
                  </div>
                </div>
                <button
                  onClick={() => loadListAsTrip(list)}
                  style={{ background: '#F3E8FF', border: 'none', borderRadius: '6px', padding: '6px 12px', color: '#8B5CF6', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Als Reise laden
                </button>
                <button onClick={() => deleteList(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={16} color="#CCC" />
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
