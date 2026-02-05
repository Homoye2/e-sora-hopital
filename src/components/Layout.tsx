import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Bell,
  Building2,
  Stethoscope,
  Clock,
  UserCheck,
  ClipboardList,
  Pill,
  FolderOpen
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { authService, hopitalService, specialisteService, rendezVousService, notificationsService, type User, type Hopital, type Specialiste } from '../services/api'
import logo from "../assets/e_sora.png"

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['admin_hopital', 'specialiste'],
    permissions: []
  },
   {
    title: 'Registres',
    icon: ClipboardList,
    path: '/registres',
    roles: ['admin_hopital', 'specialiste'],
    permissions: []
  },
   {
    title: 'Dossiers Médicaux',
    icon: FolderOpen,
    path: '/dossiers-medicaux',
    roles: ['specialiste'],
    permissions: []
  },
  {
    title: 'Ordonnances',
    icon: Pill,
    path: '/ordonnances',
    roles: ['admin_hopital', 'specialiste'],
    permissions: []
  },
 
  {
    title: 'Spécialistes',
    icon: UserCheck,
    path: '/specialistes',
    roles: ['admin_hopital'],
    permissions: []
  },
  {
    title: 'Patients',
    icon: UserIcon,
    path: '/patients',
    roles: ['admin_hopital'],
    permissions: []
  },

  {
    title: 'Consultations',
    icon: Stethoscope,
    path: '/consultations',
    roles: ['admin_hopital', 'specialiste'],
    permissions: []
  },
  {
    title: 'Rapports',
    icon: FileText,
    path: '/rapports',
    roles: ['admin_hopital', 'specialiste'],
    permissions: []
  },
    {
    title: 'Rendez-vous',
    icon: Calendar,
    path: '/rendez-vous',
    roles: ['admin_hopital', 'specialiste'],
    permissions: [],
    badge: true
  },
    {
    title: 'Disponibilités',
    icon: Clock,
    path: '/disponibilites',
    roles: ['specialiste'],
    permissions: []
  },
  {
    title: 'Notifications',
    icon: Bell,
    path: '/notifications',
    roles: ['admin_hopital', 'specialiste'],
    permissions: [],
    badge: true
  },
  {
    title: 'Paramètres',
    icon: Settings,
    path: '/parametres',
    roles: ['admin_hopital', 'specialiste'],
    permissions: []
  }
]

export const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hopital, setHopital] = useState<Hopital | null>(null)
  const [specialisteProfile, setSpecialisteProfile] = useState<Specialiste | null>(null)
  const [rendezVousCount, setRendezVousCount] = useState(0)
  const [notificationsCount, setNotificationsCount] = useState(0)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    if (!['admin_hopital', 'specialiste'].includes(currentUser.role)) {
      authService.logout()
      navigate('/login')
      return
    }

    setUser(currentUser)
    loadData()
    
    // Charger le profil spécialiste si c'est un spécialiste
    if (currentUser.role === 'specialiste') {
      loadSpecialisteProfile()
    }
  }, [navigate])

  const loadData = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser) return
      
      // Charger l'hôpital selon le rôle
      if (currentUser.role === 'admin_hopital') {
        const hopitalData = await hopitalService.getMyHopital()
        setHopital(hopitalData)
      } else if (currentUser.role === 'specialiste') {
        // Pour les spécialistes, récupérer l'hôpital depuis leur profil
        try {
          const specialisteData = await specialisteService.getMe()
          if (specialisteData.hopital) {
            const hopitalData = await hopitalService.getById(specialisteData.hopital)
            setHopital(hopitalData)
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'hôpital du spécialiste:', error)
        }
      }
      
      loadCounts()
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const loadSpecialisteProfile = async () => {
    try {
      const specialisteData = await specialisteService.getMe()
      setSpecialisteProfile(specialisteData)
    } catch (error) {
      console.error('Erreur lors du chargement du profil spécialiste:', error)
    }
  }

  const loadCounts = async () => {
    try {
      // Charger le nombre de rendez-vous en attente
      const rendezVousData = await rendezVousService.getAll({ statut: 'en_attente' })
      const rendezVousArray = Array.isArray(rendezVousData) ? rendezVousData : rendezVousData.results || []
      setRendezVousCount(rendezVousArray.length)
      
      // Charger le nombre de notifications non lues
      try {
        const notificationsCount = await notificationsService.getUnreadCount()
        setNotificationsCount(notificationsCount.count || 0)
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error)
        setNotificationsCount(0)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des compteurs:', error)
    }
  }

  // Recharger les compteurs périodiquement
  useEffect(() => {
    if (user) {
      const interval = setInterval(loadCounts, 30000) // Toutes les 30 secondes
      return () => clearInterval(interval)
    }
  }, [user])

  const hasPermission = (item: typeof menuItems[0]) => {
    if (!user) return false
    
    // Vérifier le rôle
    return item.roles.includes(user.role)
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg md:w-[180px] w-[150px]">
             <img src={logo} alt="logo-e-sora" />
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Hôpital Info */}
        {hopital && (
          <div className="px-6 py-4 bg-blue-50 border-b flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h2 className="font-medium text-blue-900 truncate">{hopital.nom}</h2>
            </div>
            <p className="text-sm text-blue-700 truncate">{hopital.ville}</p>
            {user.role === 'specialiste' && specialisteProfile && (
              <p className="text-xs text-blue-600 truncate mt-1">
                {specialisteProfile.titre} - {specialisteProfile.specialite_nom}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems
              .filter(item => hasPermission(item))
              .map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(item.path)
                
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-3" />
                        {item.title}
                      </div>
                      {item.badge && (
                        <div className="flex items-center">
                          {item.path === '/rendez-vous' && rendezVousCount > 0 && (
                            <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                              {rendezVousCount}
                            </Badge>
                          )}
                          {item.path === '/notifications' && notificationsCount > 0 && (
                            <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                              {notificationsCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </button>
                  </li>
                )
              })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-gray-100 p-2 rounded-full">
              <UserIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
              <p className="text-xs text-blue-600 truncate">
                {user.role === 'admin_hopital' ? 'Administrateur' : 'Spécialiste'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.path === location.pathname)?.title || 'Dashboard'}
              </h1>
            </div>
            
            {/* Notifications et badges dans le top bar */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-500"
              >
                <Bell className="h-6 w-6" />
                {notificationsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                  >
                    {notificationsCount}
                  </Badge>
                )}
              </button>
              
              {/* Badge rendez-vous si on n'est pas sur la page rendez-vous */}
              {location.pathname !== '/rendez-vous' && rendezVousCount > 0 && (
                <button
                  onClick={() => navigate('/rendez-vous')}
                  className="relative p-2 text-gray-400 hover:text-gray-500"
                >
                  <Calendar className="h-6 w-6" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                  >
                    {rendezVousCount}
                  </Badge>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">
            <div className="max-h-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}