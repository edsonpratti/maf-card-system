"use client"

import { Sidebar, MobileSidebarTrigger } from "@/components/admin/sidebar"
import { SessionTimeout } from "@/components/session-timeout"

interface DashboardShellProps {
    children: React.ReactNode
    userEmail?: string
    logoutAction: () => void
}

export function DashboardShell({ children, userEmail, logoutAction }: DashboardShellProps) {
    return (
        <div className="flex min-h-screen bg-muted/40">
            <SessionTimeout warningTime={25} logoutTime={30} redirectTo="/admin/login" />
            <Sidebar userEmail={userEmail} onLogout={logoutAction} />
            <MobileSidebarTrigger userEmail={userEmail} onLogout={logoutAction} />
            <main className="flex-1 overflow-auto p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
