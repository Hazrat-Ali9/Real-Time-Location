"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as signalR from "@microsoft/signalr"

interface LocationData {
    userName: string
    lat: number
    lon: number
}

interface UseSignalRReturn {
    connection: signalR.HubConnection | null
    isConnected: boolean
    error: string | null
    sendLocation: (lat: number, lon: number, userName: string) => Promise<void>
    onLocationReceived: (callback: (data: LocationData) => void) => void
    connectionState: string
    useMockMode: boolean
    toggleMockMode: () => void
}

export function useSignalR(hubUrl: string): UseSignalRReturn {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [connectionState, setConnectionState] = useState("Disconnected")
    const [useMockMode, setUseMockMode] = useState(false)
    const locationCallbackRef = useRef<((data: LocationData) => void) | null>(null)
    const mockIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Test endpoint accessibility
    const testEndpoint = useCallback(async (url: string) => {
        try {
            console.log(`Testing SignalR endpoint: ${url}`)

            // Try to access the negotiate endpoint
            const negotiateUrl = `${url}/negotiate`
            const response = await fetch(negotiateUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            console.log(`Negotiate response status: ${response.status}`)

            if (!response.ok) {
                throw new Error(`Negotiate failed: ${response.status} ${response.statusText}`)
            }

            const negotiateData = await response.json()
            console.log("Negotiate successful:", negotiateData)
            return true
        } catch (err) {
            console.error("Endpoint test failed:", err)
            return false
        }
    }, [])

    const toggleMockMode = useCallback(() => {
        setUseMockMode((prev) => !prev)
        setError(null)
    }, [])

    // Mock SignalR functionality for development/testing
    const startMockMode = useCallback(() => {
        console.log("Starting mock SignalR mode")
        setIsConnected(true)
        setConnectionState("Connected (Mock)")
        setError(null)

        // Simulate receiving location updates in mock mode
        if (mockIntervalRef.current) {
            clearInterval(mockIntervalRef.current)
        }

        mockIntervalRef.current = setInterval(() => {
            if (locationCallbackRef.current) {
                // Generate mock location data
                const mockData: LocationData = {
                    userName: "mock.user@example.com",
                    lat: 25.73736464 + (Math.random() - 0.5) * 0.01,
                    lon: 90.3644747 + (Math.random() - 0.5) * 0.01,
                }
                console.log("Mock location received:", mockData)
                locationCallbackRef.current(mockData)
            }
        }, 3000)
    }, [])

    const stopMockMode = useCallback(() => {
        console.log("Stopping mock SignalR mode")
        if (mockIntervalRef.current) {
            clearInterval(mockIntervalRef.current)
            mockIntervalRef.current = null
        }
        setIsConnected(false)
        setConnectionState("Disconnected")
    }, [])

    useEffect(() => {
        if (useMockMode) {
            startMockMode()
            return () => stopMockMode()
        }

        let newConnection: signalR.HubConnection | null = null

        const startConnection = async () => {
            try {
                setError(null)
                setConnectionState("Testing endpoint...")

                // Test if endpoint is accessible
                const isAccessible = await testEndpoint(hubUrl)
                if (!isAccessible) {
                    throw new Error(`SignalR endpoint not accessible: ${hubUrl}. The server may be down or the URL is incorrect.`)
                }

                setConnectionState("Connecting...")

                // Create connection with detailed logging
                newConnection = new signalR.HubConnectionBuilder()
                    .withUrl(hubUrl, {
                        skipNegotiation: false,
                        transport:
                            signalR.HttpTransportType.WebSockets |
                            signalR.HttpTransportType.ServerSentEvents |
                            signalR.HttpTransportType.LongPolling,
                        headers: {
                            "Access-Control-Allow-Origin": "*",
                        },
                    })
                    .withAutomaticReconnect({
                        nextRetryDelayInMilliseconds: (retryContext) => {
                            if (retryContext.previousRetryCount < 3) {
                                return Math.random() * 10000 + 2000 // 2-12 seconds
                            } else {
                                return null // Stop retrying
                            }
                        },
                    })
                    .configureLogging(signalR.LogLevel.Information)
                    .build()

                // Connection event handlers
                newConnection.onclose((error) => {
                    console.log("SignalR connection closed:", error)
                    setIsConnected(false)
                    setConnectionState("Disconnected")
                    if (error) {
                        setError(`Connection closed: ${error.message}`)
                    }
                })

                newConnection.onreconnecting((error) => {
                    console.log("SignalR reconnecting:", error)
                    setIsConnected(false)
                    setConnectionState("Reconnecting...")
                    setError("Connection lost, attempting to reconnect...")
                })

                newConnection.onreconnected((connectionId) => {
                    console.log("SignalR reconnected:", connectionId)
                    setIsConnected(true)
                    setConnectionState("Connected")
                    setError(null)
                })

                // Set up location receiver
                newConnection.on("ReceiveLatLon", (data: LocationData) => {
                    console.log("Received location via SignalR:", data)
                    if (locationCallbackRef.current) {
                        locationCallbackRef.current(data)
                    }
                })

                // Start the connection
                await newConnection.start()

                console.log("SignalR Connected successfully")
                setConnection(newConnection)
                setIsConnected(true)
                setConnectionState("Connected")
                setError(null)
            } catch (err) {
                console.error("SignalR Connection Error:", err)
                const errorMessage = err instanceof Error ? err.message : "Unknown connection error"
                setError(`Connection failed: ${errorMessage}`)
                setConnectionState("Failed")
                setIsConnected(false)

                // Auto-switch to mock mode if connection fails
                setTimeout(() => {
                    console.log("Auto-switching to mock mode due to connection failure")
                    setUseMockMode(true)
                }, 2000)
            }
        }

        startConnection()

        return () => {
            if (newConnection) {
                console.log("Cleaning up SignalR connection")
                newConnection.stop()
            }
            stopMockMode()
        }
    }, [hubUrl, useMockMode, testEndpoint, startMockMode, stopMockMode])

    const sendLocation = useCallback(
        async (lat: number, lon: number, userName: string) => {
            if (useMockMode) {
                console.log("Mock location sent:", { lat, lon, userName })
                return
            }

            if (connection && isConnected) {
                try {
                    await connection.invoke("SendLatLon", lat, lon, userName)
                    console.log("Location sent via SignalR:", { lat, lon, userName })
                } catch (err) {
                    console.error("Error sending location:", err)
                    const errorMessage = err instanceof Error ? err.message : "Failed to send location"
                    setError(`Send failed: ${errorMessage}`)
                }
            } else {
                console.warn("Cannot send location: not connected")
                setError("Cannot send location: not connected to SignalR hub")
            }
        },
        [connection, isConnected, useMockMode],
    )

    const onLocationReceived = useCallback((callback: (data: LocationData) => void) => {
        locationCallbackRef.current = callback
    }, [])

    return {
        connection,
        isConnected,
        error,
        sendLocation,
        onLocationReceived,
        connectionState,
        useMockMode,
        toggleMockMode,
    }
}
