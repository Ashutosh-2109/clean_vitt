import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import StudentDashboardClient from "@/components/student-dashboard-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default async function StudentDashboardPage() {
    const token = cookies().get("token")?.value
    const role = cookies().get("role")?.value

    if (!token || role !== "student") {
        redirect("/student/login")
    }

    try {
        const [requestsRes] = await Promise.all([
            fetch(`${API_URL}/api/requests`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store"
            })
        ])

        const requests: any[] = await requestsRes.json()

        const activeRequest = requests.find(
            (r: any) => r.status === "pending" || r.status === "in_progress"
        ) || null

        const history = requests.filter((r: any) => r.status === "completed")

        const user = {
            name: cookies().get("userName")?.value || "Student"
        }

        const studentProfile = {
            block: cookies().get("userBlock")?.value || "",
            roomNo: cookies().get("userRoom")?.value || "",
            groupId: ""
        }

        return (
            <StudentDashboardClient
                user={user}
                studentProfile={studentProfile}
                activeRequest={activeRequest}
                history={history}
            />
        )
    } catch (e) {
        redirect("/student/login")
    }
}
