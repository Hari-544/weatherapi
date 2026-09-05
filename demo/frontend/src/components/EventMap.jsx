import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const severityColor = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

const severityRadius = {
  low: 6,
  moderate: 9,
  high: 12,
  critical: 15,
}

export default function EventMap({ events, onSelect }) {
  // Fix default icon issue in bundlers
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  const placed = useMemo(
    () => events.filter((e) => typeof e.latitude === 'number' && typeof e.longitude === 'number'),
    [events]
  )

  return (
    <div className="h-[420px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={[22.5, 79.5]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {placed.map((e) => {
          const isFake = e.is_fake
          return (
            <CircleMarker
              key={e.id}
              center={[e.latitude, e.longitude]}
              radius={isFake ? severityRadius[e.severity] || 8 : severityRadius[e.severity] || 8}
              pathOptions={{
                color: isFake ? '#64748b' : severityColor[e.severity] || '#6366f1',
                fillColor: isFake ? '#64748b' : severityColor[e.severity] || '#6366f1',
                fillOpacity: isFake ? 0.5 : 0.7,
                weight: isFake ? 1 : 2,
                dashArray: isFake ? '4 4' : null,
              }}
              eventHandlers={{ click: () => onSelect && onSelect(e) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
                <span className="font-medium">{e.city || 'Unknown'}</span>
              </Tooltip>
              <Popup>
                <div className="text-sm space-y-1">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-slate-600">
                    {e.city}, {e.state}
                  </div>
                  <div className="text-xs">
                    <span className="capitalize">{e.event_type}</span> ·{' '}
                    <span className="capitalize">{e.severity}</span>
                  </div>
                  {isFake && (
                    <div className="text-xs font-semibold text-rose-600">⚠ Possibly fake</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
