"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface LocationData {
  userName: string
  lat: number
  lon: number
  timestamp?: number
}

interface MapComponentProps {
  locations: LocationData[]
}

export default function MapComponent({ locations }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([25.73736464, 90.3644747], 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const markers = markersRef.current

    // Update markers for current locations
    const activeUserNames = new Set<string>()

    locations.forEach((location) => {
      activeUserNames.add(location.userName)

      if (markers.has(location.userName)) {
        // Update existing marker
        const marker = markers.get(location.userName)!
        marker.setLatLng([location.lat, location.lon])
        marker.setPopupContent(`
          <div>
            <strong>${location.userName}</strong><br/>
            Lat: ${location.lat.toFixed(6)}<br/>
            Lon: ${location.lon.toFixed(6)}<br/>
            ${location.timestamp ? `Updated: ${new Date(location.timestamp).toLocaleTimeString()}` : ""}
          </div>
        `)
      } else {
        // Create new marker
        const marker = L.marker([location.lat, location.lon])
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>${location.userName}</strong><br/>
              Lat: ${location.lat.toFixed(6)}<br/>
              Lon: ${location.lon.toFixed(6)}<br/>
              ${location.timestamp ? `Updated: ${new Date(location.timestamp).toLocaleTimeString()}` : ""}
            </div>
          `)

        markers.set(location.userName, marker)
      }
    })

    // Remove markers for users no longer active
    markers.forEach((marker, userName) => {
      if (!activeUserNames.has(userName)) {
        map.removeLayer(marker)
        markers.delete(userName)
      }
    })

    // Auto-fit map to show all markers
    if (locations.length > 0) {
      const group = new L.FeatureGroup(Array.from(markers.values()))
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [locations])

  return <div ref={mapContainerRef} className="h-96 w-full rounded-lg border" style={{ minHeight: "400px" }} />
}
