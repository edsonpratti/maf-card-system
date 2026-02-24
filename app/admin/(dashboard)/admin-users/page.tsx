import { getMyAdminInfo, getAdminUsers } from "@/app/actions/admin-users"
import { redirect } from "next/navigation"
import { AdminUsersClient } from "./client"

export default async function AdminUsersPage() {
    const [myInfo, initialAdmins] = await Promise.all([
        getMyAdminInfo(),
        getAdminUsers(),
    ])

    if (myInfo?.role !== "master") {
        redirect("/admin")
    }

    return <AdminUsersClient initialAdmins={initialAdmins as any} />
}
