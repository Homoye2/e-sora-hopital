import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  Bell, 
  Search,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
  Info,
  X,
  Eye
} from 'lucide-react'
import { 
  notificationsService,
  authService,
  type Notification
} from '../services/api'
import { formatDateTime, formatDate } from '../lib/utils'

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const notificationsData = await notificationsService.getAll()
      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : notificationsData.results || []
      setNotifications(notificationsArray)
      
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsService.markAsRead(id)
      await loadData()
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      await loadData()
    } catch (error) {
      console.error('Erreur lors du marquage de toutes comme lues:', error)
    }
  }

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) return
    
    try {
      await notificationsService.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    const config = notificationsService.getTypeConfig(type)
    
    switch (config.icon) {
      case 'calendar':
        return Calendar
      case 'check':
        return Check
      case 'x':
        return X
      case 'bell':
        return Bell
      case 'file-text':
        return FileText
      case 'info':
      default:
        return Info
    }
  }

  const getNotificationColor = (type: string) => {
    const config = notificationsService.getTypeConfig(type)
    
    switch (config.color) {
      case 'blue':
        return 'text-blue-600 bg-blue-100'
      case 'green':
        return 'text-green-600 bg-green-100'
      case 'red':
        return 'text-red-600 bg-red-100'
      case 'orange':
        return 'text-orange-600 bg-orange-100'
      case 'gray':
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || selectedType === '' || notification.type_notification === selectedType
    
    const matchesStatus = selectedStatus === 'all' || selectedStatus === '' || 
                         (selectedStatus === 'lu' && notification.lu) ||
                         (selectedStatus === 'non_lu' && !notification.lu)
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Grouper les notifications par date
  const notificationsByDate = filteredNotifications.reduce((acc, notification) => {
    const date = formatDate(notification.created_at)
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(notification)
    return acc
  }, {} as Record<string, Notification[]>)

  const unreadCount = notifications.filter(n => !n.lu).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </h1>
          <p className="text-gray-600">
            Gérez vos notifications et alertes
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            onClick={handleMarkAllAsRead}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Non lues</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rendez-vous</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type_notification.includes('rendez_vous')).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rapports</p>
                <p className="text-2xl font-bold text-purple-600">
                  {notifications.filter(n => n.type_notification === 'consultation_rapport').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans les notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="rendez_vous_nouveau">Nouveau RDV</SelectItem>
                <SelectItem value="rendez_vous_confirme">RDV Confirmé</SelectItem>
                <SelectItem value="rendez_vous_refuse">RDV Refusé</SelectItem>
                <SelectItem value="rendez_vous_rappel">Rappel RDV</SelectItem>
                <SelectItem value="consultation_rapport">Rapport</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="non_lu">Non lues</SelectItem>
                <SelectItem value="lu">Lues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications groupées par date */}
      <div className="space-y-6">
        {Object.keys(notificationsByDate).length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune notification trouvée</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(notificationsByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dayNotifications]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-lg">{date}</CardTitle>
                  <CardDescription>
                    {dayNotifications.length} notification{dayNotifications.length > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayNotifications
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((notification) => {
                        const Icon = getNotificationIcon(notification.type_notification)
                        const colorClass = getNotificationColor(notification.type_notification)
                        const config = notificationsService.getTypeConfig(notification.type_notification)
                        
                        return (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                              notification.lu ? 'bg-gray-50' : 'bg-white border-blue-200'
                            }`}
                          >
                            <div className={`p-2 rounded-full ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`font-medium ${notification.lu ? 'text-gray-700' : 'text-gray-900'}`}>
                                      {notification.titre}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      {config.label}
                                    </Badge>
                                    {!notification.lu && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    )}
                                  </div>
                                  
                                  <p className={`text-sm ${notification.lu ? 'text-gray-600' : 'text-gray-700'} mb-2`}>
                                    {notification.message}
                                  </p>
                                  
                                  <p className="text-xs text-gray-500">
                                    {new Date(notification.created_at).toLocaleTimeString('fr-FR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                    {notification.lu && notification.date_lecture && (
                                      <span className="ml-2">
                                        • Lu le {formatDateTime(notification.date_lecture)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedNotification(notification)
                                      setShowDetailsModal(true)
                                      if (!notification.lu) {
                                        handleMarkAsRead(notification.id)
                                      }
                                    }}
                                    title="Voir les détails"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  
                                  {!notification.lu ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="text-green-600 hover:text-green-700"
                                      title="Marquer comme lu"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Marquer comme non lu (si l'API le supporte)
                                        console.log('Marquer comme non lu:', notification.id)
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
                                      title="Marquer comme non lu"
                                    >
                                      <Bell className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la Notification
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Titre</h3>
                  <p className="text-gray-700">{selectedNotification.titre}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Type</h3>
                    <Badge variant="outline">
                      {notificationsService.getTypeConfig(selectedNotification.type_notification).label}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Statut</h3>
                    <Badge variant={selectedNotification.lu ? "default" : "destructive"}>
                      {selectedNotification.lu ? 'Lu' : 'Non lu'}
                    </Badge>
                  </div>
                </div>
                
                {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Données supplémentaires</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedNotification.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 pt-4 border-t">
                  <div>
                    <p>Créé le: {formatDateTime(selectedNotification.created_at)}</p>
                  </div>
                  <div>
                    {selectedNotification.date_lecture && (
                      <p>Lu le: {formatDateTime(selectedNotification.date_lecture)}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                {!selectedNotification.lu && (
                  <Button
                    onClick={() => {
                      handleMarkAsRead(selectedNotification.id)
                      setShowDetailsModal(false)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Marquer comme lu
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  variant="outline"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}