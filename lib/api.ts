import { ApiResponse } from "../types/index"


export async function fetchUsers({ pageParam = 0 }): Promise<ApiResponse> {
    const response = await fetch(`https://tech-test.raintor.com/api/users/GetUsersList?take=10&skip=${pageParam}`)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
}
