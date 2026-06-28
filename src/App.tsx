import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { EventDashboard } from './pages/EventDashboard'
import { ItemsPage } from './pages/ItemsPage'
import { ContainersPage } from './pages/ContainersPage'
import { ContainerDetailPage } from './pages/ContainerDetailPage'
import { ScanPage } from './pages/ScanPage'
import { SettingsPage } from './pages/SettingsPage'
import { JoinPage } from './pages/JoinPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/join/:inviteCode" element={<JoinPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:eventId" element={<EventDashboard />} />
          <Route path="/events/:eventId/items" element={<ItemsPage />} />
          <Route path="/events/:eventId/containers" element={<ContainersPage />} />
          <Route path="/events/:eventId/containers/:containerId" element={<ContainerDetailPage />} />
          <Route path="/events/:eventId/scan" element={<ScanPage />} />
          <Route path="/events/:eventId/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}