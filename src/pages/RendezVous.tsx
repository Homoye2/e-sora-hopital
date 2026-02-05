import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { 
  Clock, 
  Search,
  Check,
  X,
  Eye,
  Phone,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { 
  rendezVousService,
  specialisteService,
  authService,
  type RendezVous as RendezVousType,
  type User as UserType,
  type Specialiste
} from '../services/api'
import { formatDateTime, formatDate } from '../lib/utils'

const statusConfig = {
  'en_attente': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'confirme': { label: 'Confirmé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'refuse': { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: XCircle },
  'annule': { label: 'Annulé', color: 'bg-gray-100 text-gray-800', icon: X },
  'termine': { label: 'Terminé', color: 'bg-blue-100 text-blue-800', icon: Check }
}

export const RendezVousPage = () => {
  const [rendezVous, setRendezVous] = useState<RendezVousType[]>([])
  const [specialistes, setSpecialistes] = useState<Specialiste[]>([])
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedSpecialiste, setSelectedSpecialiste] = useState<string>('')
  const [selectedRdv, setSelectedRdv] = useState<RendezVousType | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'confirmer' | 'refuser' | 'annuler'>('confirmer')
  const [actionNotes, setActionNotes] = useState('')
  const [actionMotif, setActionMotif] = useState('')

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      loadData(currentUser)
    }
  }, [])

  const loadData = async (currentUser: UserType) => {
    try {
      setLoading(true)
      
      // Charger les rendez-vous selon le rôle
      let rendezVousData
      if (currentUser.role === 'admin_hopital') {
        rendezVousData = await rendezVousService.getAll()
        
        // Charger tous les spécialistes de l'hôpital
        const specialistesData = await specialisteService.getAll()
        const specialistesArray = Array.isArray(specialistesData) ? specialistesData : specialistesData.results || []
        setSpecialistes(specialistesArray)
      } else if (currentUser.role === 'specialiste') {
        rendezVousData = await rendezVousService.getMesRendezVous()
      }
      
      const rendezVousArray = Array.isArray(rendezVousData) ? rendezVousData : rendezVousData.results || []
      setRendezVous(rendezVousArray)
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (rdv: RendezVousType, action: 'confirmer' | 'refuser' | 'annuler') => {
    setSelectedRdv(rdv)
    setActionType(action)
    setActionNotes('')
    setActionMotif('')
    setShowActionModal(true)
  }

  const executeAction = async () => {
    if (!selectedRdv) return
    
    try {
      switch (actionType) {
        case 'confirmer':
          await rendezVousService.confirmer(selectedRdv.id, actionNotes)
          break
        case 'refuser':
          if (!actionMotif.trim()) {
            alert('Le motif de refus est obligatoire')
            return
          }
          await rendezVousService.refuser(selectedRdv.id, actionMotif)
          break
        case 'annuler':
          await rendezVousService.annuler(selectedRdv.id, actionMotif)
          break
      }
      
      // Recharger les données
      if (user) {
        await loadData(user)
      }
      
      setShowActionModal(false)
      setSelectedRdv(null)
      
    } catch (error) {
      console.error('Erreur lors de l\'action:', error)
      alert('Erreur lors de l\'exécution de l\'action')
    }
  }

  const filteredRendezVous = rendezVous.filter(rdv => {
    const matchesSearch = rdv.patient_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rdv.patient_prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rdv.specialiste_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rdv.motif.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || selectedStatus === '' || rdv.statut === selectedStatus
    
    const matchesSpecialiste = selectedSpecialiste === 'all' || selectedSpecialiste === '' || 
                              rdv.specialiste.toString() === selectedSpecialiste
    
    return matchesSearch && matchesStatus && matchesSpecialiste
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600">
            {user?.role === 'admin_hopital' 
              ? 'Gestion de tous les rendez-vous de l\'hôpital'
              : 'Mes rendez-vous patients'
            }
          </p>
        </div>
        
        {/* Statistiques rapides */}
        <div className="flex gap-4">
          <Card className="w-auto">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {rendezVous.filter(rdv => rdv.statut === 'en_attente').length}
                </div>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="w-auto">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {rendezVous.filter(rdv => rdv.statut === 'confirme').length}
                </div>
                <p className="text-sm text-gray-600">Confirmés</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par patient, spécialiste ou motif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {user?.role === 'admin_hopital' && (
              <Select value={selectedSpecialiste} onValueChange={setSelectedSpecialiste}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les spécialistes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les spécialistes</SelectItem>
                  {specialistes.map((specialiste) => (
                    <SelectItem key={specialiste.id} value={specialiste.id.toString()}>
                      {specialiste.titre} {specialiste.user_nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des rendez-vous */}
      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous ({filteredRendezVous.length})</CardTitle>
          <CardDescription>
            Liste des rendez-vous avec possibilité d'actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Spécialiste</TableHead>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRendezVous.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucun rendez-vous trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRendezVous.map((rdv) => {
                    const StatusIcon = statusConfig[rdv.statut as keyof typeof statusConfig]?.icon || Clock
                    const statusColor = statusConfig[rdv.statut as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                    
                    return (
                      <TableRow key={rdv.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rdv.patient_nom} {rdv.patient_prenom}</p>
                            {rdv.patient_telephone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {rdv.patient_telephone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rdv.specialiste_titre} {rdv.specialiste_nom}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatDate(rdv.datetime)}</p>
                            <p className="text-sm text-gray-500">{new Date(rdv.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{rdv.motif}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColor} flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[rdv.statut as keyof typeof statusConfig]?.label || rdv.statut_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRdv(rdv)
                                setShowDetailsModal(true)
                              }}
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Actions selon le statut et le rôle */}
                            {rdv.statut === 'en_attente' && user?.role === 'specialiste' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(rdv, 'confirmer')}
                                  className="text-green-600 hover:text-green-700"
                                  title="Confirmer"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(rdv, 'refuser')}
                                  className="text-red-600 hover:text-red-700"
                                  title="Refuser"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            {(rdv.statut === 'en_attente' || rdv.statut === 'confirme') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(rdv, 'annuler')}
                                className="text-orange-600 hover:text-orange-700"
                                title="Annuler"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de détails */}
      {showDetailsModal && selectedRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails du Rendez-vous
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Patient</h3>
                    <p>{selectedRdv.patient_nom} {selectedRdv.patient_prenom}</p>
                    {selectedRdv.patient_telephone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedRdv.patient_telephone}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Spécialiste</h3>
                    <p>{selectedRdv.specialiste_titre} {selectedRdv.specialiste_nom}</p>
                    <p className="text-sm text-gray-600">{selectedRdv.hopital_nom}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Date et Heure</h3>
                    <p>{formatDateTime(selectedRdv.datetime)}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Statut</h3>
                    <Badge className={`${statusConfig[selectedRdv.statut as keyof typeof statusConfig]?.color} flex items-center gap-1 w-fit`}>
                      {statusConfig[selectedRdv.statut as keyof typeof statusConfig]?.label || selectedRdv.statut_display}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Motif</h3>
                  <p className="text-gray-700">{selectedRdv.motif}</p>
                </div>
                
                {selectedRdv.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700">{selectedRdv.notes}</p>
                  </div>
                )}
                
                {selectedRdv.motif_refus && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Motif de refus</h3>
                    <p className="text-red-700">{selectedRdv.motif_refus}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <p>Créé le: {formatDateTime(selectedRdv.created_at)}</p>
                  </div>
                  <div>
                    <p>Modifié le: {formatDateTime(selectedRdv.updated_at)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t mt-6">
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

      {/* Modal d'action */}
      {showActionModal && selectedRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {actionType === 'confirmer' && 'Confirmer le rendez-vous'}
                  {actionType === 'refuser' && 'Refuser le rendez-vous'}
                  {actionType === 'annuler' && 'Annuler le rendez-vous'}
                </h2>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedRdv.patient_nom} {selectedRdv.patient_prenom}</p>
                  <p className="text-sm text-gray-600">{formatDateTime(selectedRdv.datetime)}</p>
                </div>
                
                {actionType === 'confirmer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Ajouter des notes pour ce rendez-vous..."
                      rows={3}
                    />
                  </div>
                )}
                
                {(actionType === 'refuser' || actionType === 'annuler') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif {actionType === 'refuser' ? 'de refus' : 'd\'annulation'} *
                    </label>
                    <Textarea
                      value={actionMotif}
                      onChange={(e) => setActionMotif(e.target.value)}
                      placeholder={`Expliquez le motif ${actionType === 'refuser' ? 'du refus' : 'de l\'annulation'}...`}
                      rows={3}
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <Button
                  onClick={() => setShowActionModal(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={executeAction}
                  className={
                    actionType === 'confirmer' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'refuser' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  }
                >
                  {actionType === 'confirmer' && 'Confirmer'}
                  {actionType === 'refuser' && 'Refuser'}
                  {actionType === 'annuler' && 'Annuler'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}