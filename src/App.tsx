import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Specialistes } from './pages/Specialistes'
import { Patients } from './pages/Patients'
import { RendezVousPage as RendezVous } from './pages/RendezVous'
import { Consultations } from './pages/Consultations'
import { Disponibilites } from './pages/Disponibilites'
import { Notifications } from './pages/Notifications'
import { Rapports } from './pages/Rapports'
import { Parametres } from './pages/Parametres'
import Registres from './pages/Registres'
import Ordonnances from './pages/Ordonnances'
import DossiersMedicaux from './pages/DossiersMedicaux'
import { authService } from './services/api'
import './index.css'

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUser()
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  
  // Vérifier que l'utilisateur a le bon rôle
  if (!['admin_hopital', 'specialiste'].includes(user.role)) {
    authService.logout()
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Route de connexion */}
        <Route path="/login" element={<Login />} />
        
        {/* Routes protégées */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="specialistes" element={<Specialistes />} />
          <Route path="patients" element={<Patients />} />
          <Route path="rendez-vous" element={<RendezVous />} />
          <Route path="consultations" element={<Consultations />} />
          <Route path="disponibilites" element={<Disponibilites />} />
          <Route path="registres" element={<Registres />} />
          <Route path="ordonnances" element={<Ordonnances />} />
          <Route path="dossiers-medicaux" element={<DossiersMedicaux />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="parametres" element={<Parametres />} />
        </Route>
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
