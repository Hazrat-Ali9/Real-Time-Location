import { UserCard } from "./UserCard";


export function VirtualizedUserItem({ index, style, data }: { index: number; style: any; data: any[] }) {
    const user = data[index]
    return (
        <div style={style}>
            <div className="px-4">
                <UserCard user={user} />
            </div>
        </div>
    )
}
