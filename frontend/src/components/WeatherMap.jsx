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

function scoreColor(score) {
  if (score == null) return '#9ca3af';
  if (score >= 75) return '#34d399';
  if (score >= 50) return '#38bdf8';
  if (score >= 25) return '#fbbf24';
  return '#f87171';
}

export default function WeatherMap({ events = [], height = '500px', showLegend = true, onSelectEvent }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleSelect = (event) => {
    setSelectedEvent(event);
    onSelectEvent?.(event);
  };

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds events={events} />
        {events.map((event) => {
          if (!event.latitude || !event.longitude) return null;
          const color = EVENT_COLORS[event.event_type] || '#64748b';
          const radius = SEVERITY_SIZES[event.severity] || 6;
          const intel = event.intelligence || {};
          const verificationScore = event.verification_score ?? intel.verification?.score;
          const classificationConfidence = event.category_confidence
            ?? intel.classification?.confidence;
          const lifecycle = event.lifecycle ?? intel.lifecycle?.lifecycle;
          const verified = event.verification_status === 'verified';
          return (
            <CircleMarker
              key={event.id}
              center={[event.latitude, event.longitude]}
              radius={radius}
              pathOptions={{
                color: verified ? scoreColor(verificationScore) : color,
                fillColor: color,
                fillOpacity: verified ? 0.9 : 0.6,
                weight: verified ? 3 : 1,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => handleSelect(event),
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
                    {verificationScore != null && (
                      <div className="col-span-2">
                        <span className="font-medium">AI Verification:</span>{' '}
                        <span style={{ color: scoreColor(verificationScore) }}>
                          {Math.round(verificationScore)}/100
                        </span>
                      </div>
                    )}
                    {classificationConfidence != null && (
                      <div className="col-span-2">
                        <span className="font-medium">AI Classification:</span>{' '}
                        {event.event_type} ({(classificationConfidence * 100).toFixed(0)}%)
                      </div>
                    )}
                    {lifecycle && (
                      <div className="col-span-2">
                        <span className="font-medium">Lifecycle:</span> {lifecycle}
                      </div>
                    )}
                    <div className="col-span-2 text-gray-400">
                      {dayjs(event.reported_at).format('DD MMM YYYY, hh:mm A')}
                    </div>
                  </div>
                  <a
                    href={`/events/${event.id}/intelligence`}
                    onClick={(e) => { e.stopPropagation(); handleSelect(event); }}
                    className="mt-2 inline-block text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View AI intelligence →
                  </a>
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
          <p className="mt-2 border-t border-dark-700/50 pt-2 text-[10px] text-gray-500">
            Ring color = AI verification score on verified events
          </p>
        </div>
      )}
    </div>
  );
}
