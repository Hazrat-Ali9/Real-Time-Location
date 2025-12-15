"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchUsers } from "@/lib/api"
import { FixedSizeList as List } from "react-window"
import { Users, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { type User } from "@/types"
import { UserCardSkeleton } from "@/components/user/UserCardSkeleton"
import { UserCard } from "@/components/user/UserCard"
import { VirtualizedUserItem } from "@/components/user/VirtualizedUserItem"
import Link from "next/link"

const UsersPage = () => {
    const [isOnline, setIsOnline] = useState(true)
    const [useVirtualization, setUseVirtualization] = useState(false)
    const observerRef = useRef<IntersectionObserver>(null)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status } = useInfiniteQuery({
        queryKey: ["users"],
        queryFn: fetchUsers,
        getNextPageParam: (lastPage) => {
            const nextSkip = lastPage.skip + lastPage.limit
            return nextSkip < lastPage.total ? nextSkip : undefined
        },
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
        retry: 3,
    })

    const lastUserElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (isFetchingNextPage) return
            if (observerRef.current) observerRef.current.disconnect()

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasNextPage && !isFetching) {
                        fetchNextPage()
                    }
                },
                {
                    threshold: 0.1,
                    rootMargin: "100px",
                },
            )

            if (node) observerRef.current.observe(node)
        },
        [isFetchingNextPage, hasNextPage, isFetching, fetchNextPage],
    )

    const allUsers = data?.pages.flatMap((page) => page.users) ?? []
    const totalUsers = data?.pages[0]?.total ?? 0

    useEffect(() => {
        setUseVirtualization(allUsers.length > 50)
    }, [allUsers.length])

    if (status === "pending") {
        return (
            <div className="p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <UserCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (status === "error") {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Error loading users: {error?.message || "Unknown error"} {!isOnline && "(Offline)"}
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/" className="text-green-600 hover:text-green-800">
                        ← Back to Home
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                Infinite Scroll User Feed
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    {isOnline ? <Wifi className="text-green-600 w-4 h-4" /> : <WifiOff className="text-red-600 w-4 h-4" />}
                                    <span className={isOnline ? "text-green-600" : "text-red-600"}>{isOnline ? "Online" : "Offline"}</span>
                                </div>
                                <Badge variant="outline">{allUsers.length} of {totalUsers} users</Badge>
                                {useVirtualization && <Badge variant="secondary">Virtualized</Badge>}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {useVirtualization ? (
                            <div className="h-full">
                                <List
                                    height={700}
                                    width="100%"
                                    itemCount={allUsers.length}
                                    itemSize={140}
                                    itemData={allUsers}
                                >
                                    {VirtualizedUserItem}
                                </List>
                            </div>

                        ) : (
                            <div className="space-y-4">
                                {allUsers.map((user, index) => (
                                    <div key={user.id} ref={index === allUsers.length - 1 ? lastUserElementRef : undefined}>
                                        <UserCard user={user} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <UserCardSkeleton key={i} />)}

                        {!hasNextPage && allUsers.length > 0 && (
                            <div className="text-center py-8 text-gray-500">
                                You've reached the end! {allUsers.length} of {totalUsers}
                            </div>
                        )}

                        {!useVirtualization && hasNextPage && (
                            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                                {isFetching && <span className="text-gray-500">Loading more users...</span>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default UsersPage
