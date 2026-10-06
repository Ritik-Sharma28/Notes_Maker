import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppSidebar from '@/components/sidebar/AppSidebar'
import PageHeader from '@/components/sidebar/PageHeader'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <PageHeader
          onMenuClick={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
