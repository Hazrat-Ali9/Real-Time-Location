"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSignalR } from "@/hooks/use-signalr"
import { MapPin, Wifi, WifiOff, Users } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("@/components/map-component"), {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>,
})

interface LocationData {
    userName: string
    lat: number
    lon: number
    timestamp?: number
}

const LocationReceiver = () => {
    const [locations, setLocations] = useState<LocationData[]>([])
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

    const { isConnected, error, onLocationReceived, connectionState } = useSignalR(
        "https://tech-test.raintor.com/Hub"
    )

    useEffect(() => {
        onLocationReceived((data: LocationData) => {
            const timestamp = Date.now()
            const updatedData: LocationData = { ...data, timestamp }

            setLocations(prev => {
                const others = prev.filter(loc => loc.userName !== data.userName)
                return [...others, updatedData]
            })

            if (timersRef.current.has(data.userName)) {
                clearTimeout(timersRef.current.get(data.userName)!)
            }

            const timeout = setTimeout(() => {
                setLocations(prev => prev.filter(loc => loc.userName !== data.userName))
                timersRef.current.delete(data.userName)
            }, 30000)

            timersRef.current.set(data.userName, timeout)
        })
    }, [onLocationReceived])

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link href="/" className="text-green-600 hover:text-green-800">
                        ← Back to Home
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                    User B - Location Receiver
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        {isConnected ? (
                                            <>
                                                <Wifi className="w-4 h-4 text-green-600" />
                                                <span className="text-green-600 font-medium">{connectionState}</span>
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff className="w-4 h-4 text-red-600" />
                                                <span className="text-red-600 font-medium">{connectionState}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        <strong>Error:</strong> {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium">Active Users: {locations.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Active Locations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {locations.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 mb-2">No active locations.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {locations.map((location, index) => (
                                            <div key={`${location.userName}-${index}`} className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-medium text-sm truncate">{location.userName}</p>
                                                <p className="text-xs text-gray-600">
                                                    {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                                                </p>
                                                {location.timestamp && (
                                                    <p className="text-xs text-gray-500">{new Date(location.timestamp).toLocaleTimeString()}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Real-Time Location Map</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MapComponent locations={locations} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LocationReceiver
