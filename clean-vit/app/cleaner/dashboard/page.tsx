import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import CleanerDashboardClient from "@/components/cleaner-dashboard-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default async function CleanerDashboardPage() {
    const token = cookies().get("token")?.value
    const role = cookies().get("role")?.value

    if (!token || role !== "cleaner") {
        redirect("/cleaner/login")
    }

    try {
        const [pendingRes, activeRes] = await Promise.all([
            fetch(`${API_URL}/api/requests/pending`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store"
            }),
            fetch(`${API_URL}/api/requests`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store"
            })
        ])

        const pendingRequests = await pendingRes.json()
        const allRequests = await activeRes.json()
        const activeJobs = allRequests.filter((r: any) => r.status === "in_progress")

        const user = {
            name: cookies().get("cleanerName")?.value || "Cleaner"
        }

        const cleanerProfile = {
            assignedBlock: ""
        }

        return (
            <CleanerDashboardClient
                user={user}
                cleanerProfile={cleanerProfile}
                pendingRequests={pendingRequests}
                activeJobs={activeJobs}
            />
        )
    } catch (e) {
        redirect("/cleaner/login")
    }
}
