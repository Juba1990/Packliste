import { useState, useEffect } from 'react'
import { ref, onValue, update, push, set, remove } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Trip, Item } from '../types'
import { useWeather } from '../hooks/useWeather'
import { ArrowLeft, Share2, Check, Trash2, X } from 'lucide-react'

interface TripViewProps {
  tripId: string
  onBack: () => void
}

const ACCENT = '#8B5CF6'

interface EditingItem {
  catId: string
  itemId: string
  item: Item
}

export default function TripView({ tripId, onBack }: TripViewProps) {
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [filterPerson, setFilterPerson] = useState('Alle')
  const [newItemName, setNewItemName] = useState<{ [catId: string]: string }>({})
  const [newCatName, setNewCatName] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showSaveList, setShowSaveList] = useState(false)
  const [listName, setListName] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [editingLocation, setEditingLocation] = useState(false)
  const [newLocation, setNewLocation] = useState('')
  const [editingDates, setEditingDates] = useState(false)
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [editingPersons, setEditingPersons] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')

  const { weather } = useWeather(
    trip?.location || '',
    trip?.startDate || '',
    trip?.endDate || ''
  )

  useEffect(() => {
    if (!user) return
    const tripRef = ref(db, `users/${user.uid}/trips/${tripId}`)
    const unsub = onValue(tripRef, snap => {
      if (snap.val()) setTrip({ id: tripId, ...snap.val() })
    })
    return unsub
  }, [user, tripId])

  const updateTrip = (updates: Partial<Trip>) => {
    if (!user) return
    update(ref(db, `users/${user.uid}/trips/${tripId}`), updates)
  }

  const toggleWeightTracking = () => {
    if (!trip) return
    updateTrip({ weightTracking: !trip.weightTracking })
  }

  const toggleItem = (catId: string, itemId: string, checked: boolean) => {
    if (!user) return
    update(ref(db, `users/${user.uid}/trips/${tripId}/categories/${catId}/items/${itemId}`), { checked: !checked })
  }

  const addItem = async (catId: string) => {
    const name = newItemName[catId]?.trim()
    if (!name || !user) return
    const itemsRef = ref(db, `users/${user.uid}/trips/${tripId}/categories/${catId}/items`)
    await push(itemsRef, {
      name,
      quantity: 1,
      weight: 0,
      person: (trip?.persons?.[0] ?? 'A') as string,
      checked: false,
      comment: ''
    })
    setNewItemName({ ...newItemName, [catId]: '' })
  }

  const deleteItem = (catId: string, itemId: string) => {
    if (!user) return
    remove(ref(db, `users/${user.uid}/trips/${tripId}/categories/${catId}/items/${itemId}`))
  }

  const saveEditingItem = () => {
    if (!user || !editingItem) return
    update(ref(db, `users/${user.uid}/trips/${tripId}/categories/${editingItem.catId}/items/${editingItem.itemId}`), {
      name: editingItem.item.name,
      quantity: editingItem.item.quantity,
      weight: editingItem.item.weight || 0,
      person: editingItem.item.person,
      comment: editingItem.item.comment || ''
    })
    setEditingItem(null)
  }

  const addCategory = async () => {
    const name = newCatName.trim()
    if (!name || !user) return
    const catsRef = ref(db, `users/${user.uid}/trips/${tripId}/categories`)
    await push(catsRef, { name, items: {} })
    setNewCatName('')
  }

  const deleteCategory = (catId: string) => {
    if (!user || !confirm('Kategorie und alle Items löschen?')) return
    remove(ref(db, `users/${user.uid}/trips/${tripId}/categories/${catId}`))
  }

  const renameCategory = (catId: string) => {
    if (!editingCatName.trim() || !user) return
    update(ref(db, `users/${user.uid}/trips/${tripId}/categories/${catId}`), { name: editingCatName.trim() })
    setEditingCatId(null)
    setEditingCatName('')
  }

  const updateLocation = () => {
    if (!newLocation.trim()) return
    updateTrip({ location: newLocation.trim() })
    setEditingLocation(false)
  }

  const updateDates = () => {
    if (!newStartDate || !newEndDate) return
    updateTrip({ startDate: newStartDate, endDate: newEndDate })
    setEditingDates(false)
  }

  const renamePerson = (idx: number, newName: string) => {
    if (!trip) return
    const updated = [...(trip.persons || ['A', 'B'])]
    updated[idx] = newName
    updateTrip({ persons: updated })
  }

  const deletePerson = (idx: number) => {
    if (!trip) return
    const updated = [...(trip.persons || ['A', 'B'])]
    if (updated.length <= 1) { alert('Mindestens eine Person benötigt.'); return }
    updated.splice(idx, 1)
    updateTrip({ persons: updated })
  }

  const addPerson = () => {
    if (!trip) return
    const name = prompt('Name der neuen Person (z.B. C, Kind, Max):')
    if (name?.trim()) updateTrip({ persons: [...(trip.persons || []), name.trim()] })
  }

  const generateShareLink = async () => {
    const shareId = Math.random().toString(36).substring(2, 10)
    updateTrip({ shareId })
    if (!user || !trip) return
    await set(ref(db, `shared/${shareId}`), { ...trip, shareId, ownerUid: user.uid, tripId })
    const link = `${window.location.origin}/shared/${shareId}`
    setShareLink(link)
    navigator.clipboard?.writeText(link)
  }

  const saveAsList = async () => {
    if (!user || !trip || !listName.trim()) return
    const listsRef = ref(db, `users/${user.uid}/lists`)
    await push(listsRef, { name: listName.trim(), categories: trip.categories || {}, createdAt: Date.now() })
    setShowSaveList(false)
    setListName('')
    alert('Liste gespeichert! ✅')
  }

  const getTotalWeight = (): string => {
    if (!trip?.categories) return '0.00'
    let total = 0
    Object.values(trip.categories).forEach(cat => {
      Object.values(cat.items || {}).forEach(item => { total += (item.weight || 0) * (item.quantity || 1) })
    })
    return (total / 1000).toFixed(2)
  }

  const getPersonWeight = (person: string): string => {
    if (!trip?.categories) return '0.00'
    let total = 0
    Object.values(trip.categories).forEach(cat => {
      Object.values(cat.items || {}).forEach(item => { if (item.person === person) total += (item.weight || 0) * (item.quantity || 1) })
    })
    return (total / 1000).toFixed(2)
  }

  const getFilteredItems = (items: { [key: string]: Item }) => {
    if (filterPerson === 'Alle') return items
    return Object.fromEntries(Object.entries(items).filter(([, item]) => item.person === filterPerson))
  }

  if (!trip) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Laden...</div>

  const persons: string[] = trip.persons || ['A', 'B']
  const totalWeight = parseFloat(getTotalWeight())
  const personAWeight = parseFloat(getPersonWeight(persons[0]))

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', maxWidth: '480px', margin: '0 auto', padding: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px', color: '#999', fontSize: '13px' }}>
            <ArrowLeft size={14} /> Zurück
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#000', letterSpacing: '-0.5px' }}>{trip.name}</h1>

          {/* Location */}
          {editingLocation ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
              <input autoFocus value={newLocation} onChange={e => setNewLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && updateLocation()} placeholder={trip.location}
                style={{ padding: '6px 8px', border: `1px solid ${ACCENT}`, borderRadius: '6px', fontSize: '13px', outline: 'none', color: '#1a1a1a', width: '140px' }} />
              <button onClick={updateLocation} style={{ background: ACCENT, border: 'none', borderRadius: '6px', padding: '6px 10px', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>OK</button>
              <button onClick={() => setEditingLocation(false)} style={{ background: '#F5F5F5', border: 'none', borderRadius: '6px', padding: '6px 8px', color: '#666', fontSize: '12px', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => { setEditingLocation(true); setNewLocation(trip.location) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: ACCENT, fontWeight: '500', marginBottom: '4px' }}>
              🏔️ <span style={{ color: '#666' }}>{trip.location}</span> <span style={{ fontSize: '14px' }}>›</span>
            </button>
          )}

          {/* Dates */}
          {editingDates ? (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)}
                  style={{ padding: '6px 8px', border: `1px solid ${ACCENT}`, borderRadius: '6px', fontSize: '13px', outline: 'none', color: '#1a1a1a' }} />
                <span style={{ color: '#999' }}>–</span>
                <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)}
                  style={{ padding: '6px 8px', border: `1px solid ${ACCENT}`, borderRadius: '6px', fontSize: '13px', outline: 'none', color: '#1a1a1a' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={updateDates} style={{ background: ACCENT, border: 'none', borderRadius: '6px', padding: '6px 12px', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>OK</button>
                <button onClick={() => setEditingDates(false)} style={{ background: '#F5F5F5', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#666', fontSize: '12px', cursor: 'pointer' }}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setEditingDates(true); setNewStartDate(trip.startDate); setNewEndDate(trip.endDate) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#999' }}>
              📅 {trip.startDate} – {trip.endDate} <span style={{ fontSize: '14px' }}>›</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', paddingTop: '28px' }}>
          <button onClick={toggleWeightTracking} title="Gewicht tracken"
            style={{ background: trip.weightTracking ? ACCENT : '#F5F5F5', color: trip.weightTracking ? 'white' : '#666', border: 'none', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🏋️
          </button>
          <button onClick={() => setShowShare(true)}
            style={{ background: '#F5F5F5', border: 'none', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={16} color="#666" />
          </button>
        </div>
      </div>

      {/* Weather - scrollable for long trips */}
      {weather.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wettervorhersage</div>
          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
              {weather.map(day => (
                <div key={day.date} style={{ background: '#F9F9F9', border: '1px solid #F0F0F0', borderRadius: '10px', padding: '10px', textAlign: 'center', minWidth: '72px' }}>
                  <div style={{ fontWeight: '600', fontSize: '11px', color: '#1a1a1a', marginBottom: '6px' }}>
                    {new Date(day.date).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '300', color: '#1a1a1a', marginBottom: '1px' }}>{day.maxTemp}°</div>
                  <div style={{ fontSize: '8px', color: '#999', marginBottom: '4px' }}>{day.minTemp}° N</div>
                  <div style={{ fontSize: '10px', color: ACCENT, fontWeight: '500', whiteSpace: 'nowrap' }}>↓ {day.precipitation}mm</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weight Card */}
      {trip.weightTracking && (
        <div style={{ padding: '12px', background: '#F9F9F9', border: '1px solid #F0F0F0', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>Gesamtgewicht</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: ACCENT }}>{getTotalWeight()} kg</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999', marginBottom: '8px' }}>
            {persons.map(p => <span key={p}>{p}: {getPersonWeight(p)} kg</span>)}
          </div>
          {totalWeight > 0 && (
            <div style={{ background: '#E8E8E8', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ background: ACCENT, height: '100%', width: `${(personAWeight / totalWeight) * 100}%`, borderRadius: '3px' }} />
            </div>
          )}
        </div>
      )}

      {/* Persons Filter + Management */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['Alle', ...persons].map(p => (
            <button key={p} onClick={() => setFilterPerson(p)}
              style={{ background: filterPerson === p ? ACCENT : '#F5F5F5', color: filterPerson === p ? 'white' : '#333', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500' }}>
              {p}
            </button>
          ))}
          <button onClick={() => setEditingPersons(!editingPersons)}
            style={{ background: editingPersons ? ACCENT : '#F5F5F5', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', color: editingPersons ? 'white' : '#666', fontWeight: '500' }}>
            {editingPersons ? 'Fertig' : '✏️'}
          </button>
        </div>

        {editingPersons && (
          <div style={{ marginTop: '10px', background: '#F9F9F9', border: '1px solid #F0F0F0', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '10px', textTransform: 'uppercase' }}>Personen bearbeiten</div>
            {persons.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input value={p} onChange={e => renamePerson(idx, e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #D0D0D0', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff', outline: 'none' }} />
                <button onClick={() => deletePerson(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={14} color="#CCC" />
                </button>
              </div>
            ))}
            <button onClick={addPerson} style={{ width: '100%', padding: '8px', background: '#fff', border: `1px dashed ${ACCENT}`, borderRadius: '6px', color: ACCENT, fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
              + Person hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Packliste */}
      <div style={{ marginBottom: '14px' }}>
        {Object.entries(trip.categories || {}).map(([catId, cat]) => {
          const filteredItems = getFilteredItems(cat.items || {})
          return (
            <div key={catId} style={{ marginBottom: '12px' }}>
              {/* Category Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 50px 40px 40px', gap: '6px', alignItems: 'center', marginBottom: '6px', padding: '0 2px' }}>
                <button onClick={() => addItem(catId)} style={{ background: 'transparent', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: '16px', padding: 0, fontWeight: '600' }}>+</button>
                {editingCatId === catId ? (
                  <div style={{ display: 'flex', gap: '4px', gridColumn: '2 / 6' }}>
                    <input autoFocus value={editingCatName} onChange={e => setEditingCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameCategory(catId)}
                      style={{ flex: 1, padding: '4px 8px', border: `1px solid ${ACCENT}`, borderRadius: '6px', fontSize: '12px', outline: 'none', color: '#1a1a1a' }} />
                    <button onClick={() => renameCategory(catId)} style={{ background: ACCENT, border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', fontSize: '11px', cursor: 'pointer' }}>OK</button>
                    <button onClick={() => deleteCategory(catId)} style={{ background: '#FFF0F0', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Trash2 size={12} color="#CC0000" /></button>
                    <button onClick={() => setEditingCatId(null)} style={{ background: '#F5F5F5', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><X size={12} color="#666" /></button>
                  </div>
                ) : (
                  <>
                    <div onClick={() => { setEditingCatId(catId); setEditingCatName(cat.name) }}
                      style={{ fontWeight: '700', fontSize: '11px', color: '#000', cursor: 'pointer' }} title="Klicken zum Umbenennen/Löschen">
                      {cat.name}
                    </div>
                    {trip.weightTracking ? <div style={{ fontSize: '10px', fontWeight: '600', color: '#999', textAlign: 'right', textTransform: 'uppercase' }}>Gewicht</div> : <div />}
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#999', textAlign: 'center', textTransform: 'uppercase' }}>Menge</div>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#999', textAlign: 'center', textTransform: 'uppercase' }}>Person</div>
                  </>
                )}
              </div>

              {/* Items */}
              {Object.keys(filteredItems).length > 0 && (
                <div style={{ background: '#F9F9F9', border: '1px solid #F0F0F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '6px' }}>
                  {Object.entries(filteredItems).map(([itemId, item], i, arr) => (
                    <div key={itemId}>
                      {editingItem?.itemId !== itemId ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 50px 40px 40px', gap: '6px', alignItems: 'center', padding: '8px', borderBottom: i < arr.length - 1 ? '1px solid #F0F0F0' : 'none', opacity: item.checked ? 0.5 : 1 }}>
                          <div onClick={() => toggleItem(catId, itemId, item.checked)}
                            style={{ width: '16px', height: '16px', borderRadius: '4px', border: item.checked ? 'none' : '1.5px solid #D0D0D0', background: item.checked ? ACCENT : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {item.checked && <Check size={10} color="white" strokeWidth={3} />}
                          </div>
                          <div onClick={() => setEditingItem({ catId, itemId, item: { ...item } })}
                            style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', textDecoration: item.checked ? 'line-through' : 'none', cursor: 'pointer' }}>
                            {item.name}
                            {item.comment && <span style={{ color: '#CCC', fontSize: '10px', marginLeft: '4px' }}>· {item.comment}</span>}
                          </div>
                          {trip.weightTracking ? <div style={{ textAlign: 'right', fontSize: '10px', color: '#999' }}>{item.weight ? `${item.weight}g` : '—'}</div> : <div />}
                          <div style={{ textAlign: 'center', fontWeight: '500', fontSize: '12px', color: '#1a1a1a' }}>{item.quantity}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                            <span style={{ background: '#F3E8FF', borderRadius: '4px', padding: '2px 5px', fontWeight: '600', fontSize: '9px', color: ACCENT }}>{item.person}</span>
                            <button onClick={() => deleteItem(catId, itemId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', opacity: 0.4 }}>
                              <X size={10} color="#666" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '10px', borderBottom: i < arr.length - 1 ? '1px solid #F0F0F0' : 'none', background: '#F5F2FF' }}>
                          <input value={editingItem.item.name} onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #D0D0D0', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', marginBottom: '8px', boxSizing: 'border-box', outline: 'none' }} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                            <div>
                              <label style={{ fontSize: '9px', color: '#999', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Menge</label>
                              <input type="number" min="1" value={editingItem.item.quantity}
                                onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, quantity: parseInt(e.target.value) || 1 } })}
                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #D0D0D0', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', color: '#999', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Gewicht (g)</label>
                              <input type="number" min="0" value={editingItem.item.weight || 0}
                                onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, weight: parseInt(e.target.value) || 0 } })}
                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #D0D0D0', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', boxSizing: 'border-box', outline: 'none' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', color: '#999', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Person</label>
                              <select value={editingItem.item.person} onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, person: e.target.value } })}
                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #D0D0D0', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                                {persons.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          </div>
                          <input value={editingItem.item.comment || ''} onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, comment: e.target.value } })}
                            placeholder="Kommentar (optional)"
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #D0D0D0', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', marginBottom: '8px', boxSizing: 'border-box', outline: 'none' }} />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '7px', background: '#F5F5F5', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#333' }}>Abbrechen</button>
                            <button onClick={saveEditingItem} style={{ flex: 2, padding: '7px', background: ACCENT, border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: 'white', fontWeight: '600' }}>Speichern</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Item */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input value={newItemName[catId] || ''} onChange={e => setNewItemName({ ...newItemName, [catId]: e.target.value })} onKeyDown={e => e.key === 'Enter' && addItem(catId)}
                  placeholder={`+ Item zu ${cat.name}`}
                  style={{ flex: 1, padding: '7px 10px', border: '1px solid #E8E8E8', borderRadius: '6px', fontSize: '12px', color: '#1a1a1a', background: '#FAFAFA', outline: 'none' }} />
                {newItemName[catId] && (
                  <button onClick={() => addItem(catId)} style={{ background: ACCENT, border: 'none', borderRadius: '6px', padding: '7px 12px', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+</button>
                )}
              </div>
            </div>
          )
        })}

        {/* Add Category */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="+ Neue Kategorie"
            style={{ flex: 1, padding: '10px 12px', background: '#fff', border: `2px dashed ${ACCENT}`, borderRadius: '8px', fontSize: '13px', color: ACCENT, outline: 'none', fontWeight: '500' }} />
          {newCatName && (
            <button onClick={addCategory} style={{ background: ACCENT, border: 'none', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>+</button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button onClick={() => setShowSaveList(true)} style={{ flex: 1, background: '#F5F5F5', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', color: '#333' }}>Als Liste speichern</button>
        <button onClick={() => setShowShare(true)} style={{ flex: 1, background: '#F5F5F5', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', color: '#333' }}>Teilen</button>
      </div>

      {/* Share Modal */}
      {showShare && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '448px', margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#000' }}>Packliste teilen</h3>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>Personen mit dem Link können die Liste sehen und Items abhaken.</p>
            {!shareLink ? (
              <button onClick={generateShareLink} style={{ width: '100%', padding: '12px', background: ACCENT, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Link generieren</button>
            ) : (
              <div>
                <div style={{ background: '#F5F5F5', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>{shareLink}</div>
                <button onClick={() => navigator.clipboard?.writeText(shareLink)} style={{ width: '100%', padding: '12px', background: ACCENT, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '8px' }}>Link kopieren ✓</button>
              </div>
            )}
            <button onClick={() => { setShowShare(false); setShareLink('') }} style={{ width: '100%', padding: '10px', background: '#F5F5F5', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#666', marginTop: '8px' }}>Schließen</button>
          </div>
        </div>
      )}

      {/* Save List Modal */}
      {showSaveList && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '448px', margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#000' }}>Als Liste speichern</h3>
            <input autoFocus value={listName} onChange={e => setListName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveAsList()} placeholder="z.B. Trekking Basis, Camping Familie"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', color: '#1a1a1a', boxSizing: 'border-box', outline: 'none', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowSaveList(false)} style={{ flex: 1, padding: '10px', background: '#F5F5F5', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>Abbrechen</button>
              <button onClick={saveAsList} style={{ flex: 1, padding: '10px', background: ACCENT, color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
