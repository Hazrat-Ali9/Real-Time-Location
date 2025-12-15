"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Wifi, WifiOff, Send } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSignalR } from "@/hooks/use-signalr"

const LocationSender = () => {
    const [userName, setUserName] = useState("")
    const [isSharing, setIsSharing] = useState(false)
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)

    const { isConnected, error, sendLocation, connectionState } = useSignalR(
        "https://tech-test.raintor.com/Hub",
    )

    useEffect(() => {
        if (isSharing && isConnected && userName) {
            const interval = setInterval(() => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords
                            setCurrentLocation({ lat: latitude, lon: longitude })
                            sendLocation(latitude, longitude, userName)
                        },
                        (error) => {
                            console.warn("GPS failed, using simulated location:", error)
                            const simulatedLat = 25.73736464 + (Math.random() - 0.5) * 0.01
                            const simulatedLon = 90.3644747 + (Math.random() - 0.5) * 0.01
                            setCurrentLocation({ lat: simulatedLat, lon: simulatedLon })
                            sendLocation(simulatedLat, simulatedLon, userName)
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 },
                    )
                } else {
                    const simulatedLat = 25.73736464 + (Math.random() - 0.5) * 0.01
                    const simulatedLon = 90.3644747 + (Math.random() - 0.5) * 0.01
                    setCurrentLocation({ lat: simulatedLat, lon: simulatedLon })
                    sendLocation(simulatedLat, simulatedLon, userName)
                }
            }, 2000)

            return () => clearInterval(interval)
        }
    }, [isSharing, isConnected, userName, sendLocation])

    const handleStartSharing = () => {
        if (userName.trim()) {
            setIsSharing(true)
        }
    }

    const handleStopSharing = () => {
        setIsSharing(false)
        setCurrentLocation(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link href="/" className="text-blue-600 hover:text-blue-800">
                        ← Back to Home
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            User A - Location Sender
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
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
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-medium text-red-700 mb-1">Connection Error:</h4>
                                <p className="text-red-700 text-sm">{error}</p>

                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="userName">Your Email (User Name)</Label>
                            <Input
                                id="userName"
                                type="email"
                                placeholder="your.email@example.com"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                disabled={isSharing}
                            />
                        </div>

                        <div className="flex gap-3">
                            {!isSharing ? (
                                <Button
                                    onClick={handleStartSharing}
                                    disabled={!isConnected || !userName.trim()}
                                    className="flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Start Sharing Location
                                </Button>
                            ) : (
                                <Button onClick={handleStopSharing} variant="destructive" className="flex items-center gap-2">
                                    Stop Sharing
                                </Button>
                            )}
                        </div>

                        {isSharing && (
                            <div className="space-y-3">
                                <h3 className="font-semibold">Current Location</h3>
                                {currentLocation ? (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p>
                                            <strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}
                                        </p>
                                        <p>
                                            <strong>Longitude:</strong> {currentLocation.lon.toFixed(6)}
                                        </p>
                                        <p>
                                            <strong>User:</strong> {userName}
                                        </p>
                                        <p className="text-sm text-green-600 mt-2">
                                            ✓ Location being sent every 2 seconds Real SignalR
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p>Getting location...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default LocationSender
