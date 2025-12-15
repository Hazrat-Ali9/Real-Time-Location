import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface User {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string
    image: string
    university: string
    company: {
        title: string
    }
}

export function UserCard({ user }: { user: User }) {
    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={user.image || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback>
                            {user.firstName[0]}
                            {user.lastName[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                        <p className="text-sm text-gray-500 mb-2">{user.phone}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary">{user.company.title}</Badge>
                            <Badge variant="outline">{user.university}</Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
