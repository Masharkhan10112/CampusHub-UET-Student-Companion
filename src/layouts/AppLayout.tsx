import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { MobileNav } from '@/components/layout/MobileNav'
import { MobileSidebar, Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 overflow-x-hidden p-4 pb-24 sm:p-6 sm:pb-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
