import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ThemeProvider } from './ThemeProvider'
import { Toaster } from 'sonner'

// Layouts
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Ingest from '@/pages/Ingest'
import Processing from '@/pages/Processing'
import Topics from '@/pages/Topics'
import Note from '@/pages/Note'
import Sources from '@/pages/Sources'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

function AppRedirect() {
  const { data: _topics } = { data: null } // will be fetched in Topics page
  return <Navigate to="/app/topics" replace />
}

export default function Router() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-panel)',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/signup" element={<AuthLayout><Signup /></AuthLayout>} />

          {/* Protected app routes */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AppRedirect />} />
            <Route path="ingest" element={<Ingest />} />
            <Route path="processing/:sourceId" element={<Processing />} />
            <Route path="topics" element={<Topics />} />
            <Route path="topics/:topicId" element={<Note />} />
            <Route path="sources" element={<Sources />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
