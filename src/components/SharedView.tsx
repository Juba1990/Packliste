import { useState, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { db } from '../firebase'
import { Trip, Item } from '../types'
import { useWeather } from '../hooks/useWeather'
import { Check } from 'lucide-react'

const ACCENT = '#8B5CF6'

export default function SharedView({ shareId }: { shareId: string }) {
  const [trip, setTrip] = useState<Trip & { ownerUid?: string; tripId?: string } | null>(null)

  const { weather } = useWeather(
    trip?.location || '',
    trip?.startDate || '',
    trip?.endDate || ''
  )

  useEffect(() => {
    const sharedRef = ref(db, `shared/${shareId}`)
    const unsub = onValue(sharedRef, snap => {
      if (snap.val()) setTrip(snap.val())
    })
    return unsub
  }, [shareId])

  const toggleItem = (catId: string, itemId: string, checked: boolean) => {
    if (!trip?.ownerUid || !trip?.tripId) return
    update(ref(db, `users/${trip.ownerUid}/trips/${trip.tripId}/categories/${catId}/items/${itemId}`), { checked: !checked })
    update(ref(db, `shared/${shareId}/categories/${catId}/items/${itemId}`), { checked: !checked })
  }

  if (!trip) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', color: '#999' }}>
      Laden...
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: '480px', margin: '0 auto', padding: '16px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', paddingTop: '8px' }}>
        <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>🔗 Geteilte Packliste</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#000', letterSpacing: '-0.5px' }}>{trip.name}</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          🏔️ {trip.location} · {trip.startDate} – {trip.endDate}
        </div>
      </div>

      {/* Weather */}
      {weather.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wettervorhersage</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(weather.length, 5)}, 1fr)`, gap: '8px' }}>
            {weather.slice(0, 5).map(day => (
              <div key={day.date} style={{ background: '#F9F9F9', border: '1px solid #F0F0F0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
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
      )}

      {/* Categories */}
      {Object.entries(trip.categories || {}).map(([catId, cat]) => (
        <div key={catId} style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: '700', fontSize: '11px', color: '#000', marginBottom: '6px', padding: '0 2px' }}>{cat.name}</div>
          {Object.keys(cat.items || {}).length > 0 && (
            <div style={{ background: '#F9F9F9', border: '1px solid #F0F0F0', borderRadius: '8px', overflow: 'hidden' }}>
              {Object.entries(cat.items || {}).map(([itemId, item]: [string, Item], i, arr) => (
                <div
                  key={itemId}
                  onClick={() => toggleItem(catId, itemId, item.checked)}
                  style={{
                    display: 'grid', gridTemplateColumns: '24px 1fr 40px 40px',
                    gap: '6px', alignItems: 'center', padding: '8px',
                    borderBottom: i < arr.length - 1 ? '1px solid #F0F0F0' : 'none',
                    opacity: item.checked ? 0.5 : 1, cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px',
                    border: item.checked ? 'none' : '1.5px solid #D0D0D0',
                    background: item.checked ? ACCENT : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {item.checked && <Check size={10} color="white" strokeWidth={3} />}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', textDecoration: item.checked ? 'line-through' : 'none' }}>
                    {item.name}
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: '500', fontSize: '12px', color: '#1a1a1a' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ background: '#F3E8FF', borderRadius: '4px', padding: '2px 6px', fontWeight: '600', fontSize: '9px', color: ACCENT }}>
                      {item.person}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: '#CCC' }}>
        Erstellt mit 🎒 Packliste App
      </div>
    </div>
  )
}
