import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminDashboardClient from "@/components/admin-dashboard-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default async function AdminDashboardPage() {
    const token = cookies().get("token")?.value
    const role = cookies().get("role")?.value

    if (!token || role !== "admin") {
        redirect("/admin/login")
    }

    try {
        const res = await fetch(`${API_URL}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store"
        })
        const stats = await res.json()

        return <AdminDashboardClient stats={stats} />
    } catch (e) {
        return <AdminDashboardClient stats={{ totalRequests: 0, pendingRequests: 0, completedRequests: 0, activeCleaners: 0 }} />
    }
}
