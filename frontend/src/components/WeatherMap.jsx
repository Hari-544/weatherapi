import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import dayjs from 'dayjs';

const EVENT_COLORS = {
  rainfall: '#3b82f6',
  thunderstorm: '#8b5cf6',
  flooding: '#06b6d4',
  heatwave: '#ef4444',
  fog: '#6b7280',
  dust_storm: '#d97706',
  strong_winds: '#10b981',
  cyclone: '#dc2626',
  other: '#64748b',
};

const SEVERITY_SIZES = {
  low: 6,
  moderate: 8,
  high: 10,
  critical: 14,
};

const INDIA_CENTER = [20.5937, 78.9629];

function FitBounds({ events }) {
  const map = useMap();
  useEffect(() => {
    if (events.length > 0) {
      const validEvents = events.filter(e => e.latitude && e.longitude);
      if (validEvents.length > 0) {
        const bounds = L.latLngBounds(
          validEvents.map(e => [e.latitude, e.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [events, map]);
  return null;
}

export default function WeatherMap({ events = [], height = '500px', showLegend = true }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="relative">
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        style={{ height, width: '100%', borderRadius: '12px' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
       
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds events={events} />
        {events.map((event) => {
          if (!event.latitude || !event.longitude) return null;
          const color = EVENT_COLORS[event.event_type] || '#64748b';
          const radius = SEVERITY_SIZES[event.severity] || 6;
          return (
            <CircleMarker
              key={event.id}
              center={[event.latitude, event.longitude]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: event.verification_status === 'verified' ? 0.9 : 0.6,
                weight: event.verification_status === 'verified' ? 2 : 1,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => setSelectedEvent(event),
              }}
            >
              <Popup className="custom-popup">
                <div className="min-w-[250px] p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <h3 className="font-bold text-sm text-gray-900">{event.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-3">{event.description}</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div><span className="font-medium">Type:</span> {event.event_type}</div>
                    <div><span className="font-medium">Severity:</span> {event.severity}</div>
                    <div><span className="font-medium">City:</span> {event.city || 'N/A'}</div>
                    <div><span className="font-medium">State:</span> {event.state || 'N/A'}</div>
                    <div className="col-span-2">
                      <span className="font-medium">Status:</span> {event.verification_status}
                    </div>
                    <div className="col-span-2 text-gray-400">
                      {dayjs(event.reported_at).format('DD MMM YYYY, hh:mm A')}
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-dark-900/95 backdrop-blur-sm border border-dark-700/50 rounded-lg p-3">
          <h4 className="text-xs font-bold text-gray-300 mb-2">Event Types</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(EVENT_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-400 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
