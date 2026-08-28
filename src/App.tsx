import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PageMeta } from './components/PageMeta'
import { RouteScrollManager } from './components/RouteScrollManager'
import { SmoothScroll } from './components/SmoothScroll'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { StoryPage } from './pages/StoryPage'
import { LabPage } from './pages/LabPage'
import { PressPage } from './pages/PressPage'
import { CareersPage } from './pages/CareersPage'
import { PartnersPage } from './pages/PartnersPage'
import { ContactPage } from './pages/ContactPage'

function AppRoutes() {
  return (
    <SmoothScroll>
      <RouteScrollManager />
      <PageMeta />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </SmoothScroll>
  )
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App
