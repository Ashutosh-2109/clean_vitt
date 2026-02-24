"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToken(): string | undefined {
    return cookies().get("token")?.value
}

function authHeaders() {
    const token = getToken()
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

// ─── Student Actions ──────────────────────────────────────────────────────────

export async function studentSignup(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string
    const block = formData.get("block") as string
    const roomNo = formData.get("roomNo") as string

    if (!email.endsWith("@vitstudent.ac.in")) {
        return { error: "Must use VIT Student email (@vitstudent.ac.in)" }
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/student/signup-direct`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name, block, roomNumber: roomNo }),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Signup failed" }
    } catch (e) {
        return { error: "Could not connect to server" }
    }

    redirect("/student/login")
}

export async function studentLogin(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
        const res = await fetch(`${API_URL}/api/auth/student/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Invalid credentials" }

        // Store JWT token and user info in cookies
        cookies().set("token", data.token, { httpOnly: true, path: "/" })
        cookies().set("role", "student", { path: "/" })
        cookies().set("userName", data.user.name, { path: "/" })
        cookies().set("userBlock", data.user.block, { path: "/" })
        cookies().set("userRoom", data.user.roomNumber, { path: "/" })
    } catch (e) {
        return { error: "Could not connect to server" }
    }

    redirect("/student/dashboard")
}

// ─── Cleaner Actions ──────────────────────────────────────────────────────────

export async function cleanerLogin(formData: FormData) {
    const employeeId = formData.get("employeeId") as string
    const password = formData.get("password") as string

    try {
        const res = await fetch(`${API_URL}/api/auth/cleaner/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeId, password }),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Invalid credentials" }

        cookies().set("token", data.token, { httpOnly: true, path: "/" })
        cookies().set("role", "cleaner", { path: "/" })
        cookies().set("cleanerName", data.cleaner.name, { path: "/" })
    } catch (e) {
        return { error: "Could not connect to server" }
    }

    redirect("/cleaner/dashboard")
}

export async function acceptRequest(requestId: string) {
    try {
        const res = await fetch(`${API_URL}/api/requests/${requestId}/accept`, {
            method: "PUT",
            headers: authHeaders(),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Failed to accept request" }
        return { success: true }
    } catch (e) {
        return { error: "Could not connect to server" }
    }
}

export async function completeRequest(formData: FormData) {
    const requestId = formData.get("requestId") as string
    const secret = formData.get("secret") as string

    try {
        const res = await fetch(`${API_URL}/api/requests/${requestId}/complete`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ qrData: secret }),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Failed to complete request" }
        return { success: true }
    } catch (e) {
        return { error: "Could not connect to server" }
    }
}

// ─── Student: Create Request ──────────────────────────────────────────────────

export async function createCleaningRequest(groupId: string) {
    try {
        const res = await fetch(`${API_URL}/api/requests`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ type: "general", instructions: "" }),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Failed to create request" }
        return { success: true, qrCode: data.qrCode }
    } catch (e) {
        return { error: "Could not connect to server" }
    }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

export async function adminLogin(formData: FormData) {
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    try {
        const res = await fetch(`${API_URL}/api/auth/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Invalid credentials" }

        cookies().set("token", data.token, { httpOnly: true, path: "/" })
        cookies().set("role", "admin", { path: "/" })
    } catch (e) {
        return { error: "Could not connect to server" }
    }

    redirect("/admin/dashboard")
}

export async function registerCleaner(formData: FormData) {
    const employeeId = formData.get("employeeId") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string
    const blocks = formData.get("blocks") as string // comma separated e.g. "A,B"

    try {
        const res = await fetch(`${API_URL}/api/admin/cleaners`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                employeeId,
                name,
                password,
                blocks: blocks ? blocks.split(",").map((b) => b.trim()) : [],
            }),
        })
        const data = await res.json()
        if (!res.ok) return { error: data.error || "Failed to register cleaner" }
        return { success: true }
    } catch (e) {
        return { error: "Could not connect to server" }
    }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
    cookies().delete("token")
    cookies().delete("role")
    cookies().delete("userName")
    cookies().delete("userBlock")
    cookies().delete("userRoom")
    cookies().delete("cleanerName")
    redirect("/")
}
