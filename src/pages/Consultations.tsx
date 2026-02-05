import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { 
  Stethoscope, 
  Plus, 
  Edit,
  Eye,
  Search,
  FileText,
  Calendar,
  Clock,
  X,
  Send
} from 'lucide-react'
import { 
  specialisteService,
  rapportService,
  consultationService,
  registreService,
  authService,
  type ConsultationPF,
  type User as UserType,
  type Specialiste,
  type Registre
} from '../services/api'
import { formatDateTime, formatDate } from '../lib/utils'

export const Consultations = () => {
  const [consultations, setConsultations] = useState<ConsultationPF[]>([])
  const [registres, setRegistres] = useState<Registre[]>([])
  const [specialistes, setSpecialistes] = useState<Specialiste[]>([])
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialiste, setSelectedSpecialiste] = useState<string>('')
  const [selectedRegistre, setSelectedRegistre] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRapportModal, setShowRapportModal] = useState(false)
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationPF | null>(null)
  const [rapportData, setRapportData] = useState({
    titre: '',
    contenu: ''
  })
  const [formData, setFormData] = useState({
    registre: '',
    anamnese: '',
    examen: '',
    methode_posee: false,
    effets_secondaires: '',
    notes: '',
    observation: ''
  })

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
      
      // Charger les consultations selon le rôle
      let consultationsData
      if (currentUser.role === 'admin_hopital') {
        consultationsData = await consultationService.getAll()
        
        // Charger tous les spécialistes de l'hôpital
        const specialistesData = await specialisteService.getAll()
        const specialistesArray = Array.isArray(specialistesData) ? specialistesData : specialistesData.results || []
        setSpecialistes(specialistesArray)
      } else if (currentUser.role === 'specialiste') {
        consultationsData = await consultationService.getMesConsultations()
      }
      
      const consultationsArray = Array.isArray(consultationsData) ? consultationsData : consultationsData.results || []
      setConsultations(consultationsArray)
      
      // Charger les registres pour la liaison
      const registresData = await registreService.getAll()
      const registresArray = Array.isArray(registresData) ? registresData : registresData.results || []
      setRegistres(registresArray)
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Récupérer les informations du registre sélectionné pour obtenir l'ID du patient
      const selectedRegistre = registres.find(r => r.id === parseInt(formData.registre))
      if (!selectedRegistre) {
        alert('Veuillez sélectionner un registre valide')
        return
      }

      const consultationData = {
        ...formData,
        registre: parseInt(formData.registre),
        patient: selectedRegistre.patient || undefined // ID du patient depuis le registre
      }
      
      await consultationService.create(consultationData)
      
      if (user) {
        await loadData(user)
      }
      
      setShowCreateModal(false)
      resetForm()
      
    } catch (error) {
      console.error('Erreur lors de la création de la consultation:', error)
      alert('Erreur lors de la création de la consultation')
    }
  }

  const handleUpdateConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedConsultation) return
    
    try {
      // Récupérer les informations du registre sélectionné pour obtenir l'ID du patient
      const selectedRegistre = registres.find(r => r.id === parseInt(formData.registre))
      if (!selectedRegistre) {
        alert('Veuillez sélectionner un registre valide')
        return
      }

      const consultationData = {
        ...formData,
        registre: parseInt(formData.registre),
        patient: selectedRegistre.patient || undefined // ID du patient depuis le registre
      }
      
      await consultationService.update(selectedConsultation.id, consultationData)
      
      if (user) {
        await loadData(user)
      }
      
      setShowEditModal(false)
      setSelectedConsultation(null)
      resetForm()
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la consultation:', error)
      alert('Erreur lors de la mise à jour de la consultation')
    }
  }

  const handleCreateRapport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedConsultation) return
    
    try {
      await rapportService.create({
        consultation: selectedConsultation.id,
        ...rapportData
      })
      
      setShowRapportModal(false)
      setSelectedConsultation(null)
      setRapportData({ titre: '', contenu: '' })
      
      alert('Rapport créé avec succès')
      
    } catch (error) {
      console.error('Erreur lors de la création du rapport:', error)
      alert('Erreur lors de la création du rapport')
    }
  }

  const resetForm = () => {
    setFormData({
      registre: '',
      anamnese: '',
      examen: '',
      methode_posee: false,
      effets_secondaires: '',
      notes: '',
      observation: ''
    })
  }

  const openEditModal = (consultation: ConsultationPF) => {
    setSelectedConsultation(consultation)
    setFormData({
      registre: consultation.registre?.toString() || '',
      anamnese: consultation.anamnese,
      examen: consultation.examen,
      methode_posee: consultation.methode_posee,
      effets_secondaires: consultation.effets_secondaires,
      notes: consultation.notes,
      observation: consultation.observation
    })
    setShowEditModal(true)
  }

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = (consultation.patient_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (consultation.patient_prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (consultation.specialiste_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (consultation.anamnese?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesSpecialiste = selectedSpecialiste === 'all' || selectedSpecialiste === '' || 
                              consultation.specialiste.toString() === selectedSpecialiste
    
    const matchesRegistre = selectedRegistre === 'all' || selectedRegistre === '' || 
                           consultation.registre?.toString() === selectedRegistre
    
    return matchesSearch && matchesSpecialiste && matchesRegistre
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
          <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
          <p className="text-gray-600">
            {user?.role === 'admin_hopital' 
              ? 'Gestion de toutes les consultations de l\'hôpital'
              : 'Mes consultations patients'
            }
          </p>
        </div>
        
        {user?.role === 'specialiste' && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Consultation
          </Button>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{consultations.length}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ce mois</p>
                <p className="text-2xl font-bold">
                  {consultations.filter(c => {
                    const consultationDate = new Date(c.date)
                    const now = new Date()
                    return consultationDate.getMonth() === now.getMonth() && 
                           consultationDate.getFullYear() === now.getFullYear()
                  }).length}
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
                <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
                <p className="text-2xl font-bold">
                  {consultations.filter(c => {
                    const consultationDate = new Date(c.date)
                    const today = new Date()
                    return consultationDate.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
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
                  placeholder="Rechercher par patient, spécialiste ou diagnostic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {user?.role === 'admin_hopital' && (
              <>
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
                
                <Select value={selectedRegistre} onValueChange={setSelectedRegistre}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tous les registres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les registres</SelectItem>
                    {registres.map((registre) => (
                      <SelectItem key={registre.id} value={registre.id.toString()}>
                        {registre.nom} {registre.prenom} - {registre.diagnostic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des consultations */}
      <Card>
        <CardHeader>
          <CardTitle>Consultations ({filteredConsultations.length})</CardTitle>
          <CardDescription>
            Liste des consultations avec possibilité de gestion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Spécialiste</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Diagnostic</TableHead>
                  <TableHead>Méthode posée</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucune consultation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConsultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{consultation.patient_nom} {consultation.patient_prenom}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{consultation.specialiste_nom}</p>
                        <p className="text-sm text-gray-500">{consultation.hopital_nom}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatDate(consultation.date)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{consultation.anamnese.substring(0, 50)}...</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={consultation.methode_posee ? "default" : "secondary"}>
                          {consultation.methode_posee ? 'Oui' : 'Non'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedConsultation(consultation)
                              setShowDetailsModal(true)
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {user?.role === 'specialiste' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(consultation)}
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedConsultation(consultation)
                                  setRapportData({
                                    titre: `Rapport de consultation - ${consultation.patient_nom} ${consultation.patient_prenom}`,
                                    contenu: ''
                                  })
                                  setShowRapportModal(true)
                                }}
                                className="text-green-600 hover:text-green-700"
                                title="Créer un rapport"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Nouvelle Consultation
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateConsultation} className="space-y-4">
                <div>
                  <Label htmlFor="registre">Registre *</Label>
                  <Select value={formData.registre} onValueChange={(value) => setFormData({...formData, registre: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un registre" />
                    </SelectTrigger>
                    <SelectContent>
                      {registres.map((registre) => (
                        <SelectItem key={registre.id} value={registre.id.toString()}>
                          {registre.nom} {registre.prenom} - {registre.diagnostic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="anamnese">Anamnèse</Label>
                  <Textarea
                    id="anamnese"
                    value={formData.anamnese}
                    onChange={(e) => setFormData({...formData, anamnese: e.target.value})}
                    rows={3}
                    required
                    placeholder="Historique médical et symptômes du patient..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="examen">Examen clinique</Label>
                  <Textarea
                    id="examen"
                    value={formData.examen}
                    onChange={(e) => setFormData({...formData, examen: e.target.value})}
                    rows={3}
                    required
                    placeholder="Résultats de l'examen clinique..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.methode_posee}
                      onChange={(e) => setFormData({...formData, methode_posee: e.target.checked})}
                    />
                    <span className="text-sm font-medium">Méthode posée</span>
                  </label>
                </div>
                
                <div>
                  <Label htmlFor="effets_secondaires">Effets secondaires</Label>
                  <Textarea
                    id="effets_secondaires"
                    value={formData.effets_secondaires}
                    onChange={(e) => setFormData({...formData, effets_secondaires: e.target.value})}
                    rows={2}
                    placeholder="Effets secondaires observés ou rapportés..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    placeholder="Notes additionnelles..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="observation">Observations</Label>
                  <Textarea
                    id="observation"
                    value={formData.observation}
                    onChange={(e) => setFormData({...formData, observation: e.target.value})}
                    rows={2}
                    placeholder="Observations générales..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Créer la Consultation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Modifier la Consultation
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedConsultation(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateConsultation} className="space-y-4">
                <div>
                  <Label htmlFor="edit_registre">Registre *</Label>
                  <Select value={formData.registre} onValueChange={(value) => setFormData({...formData, registre: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un registre" />
                    </SelectTrigger>
                    <SelectContent>
                      {registres.map((registre) => (
                        <SelectItem key={registre.id} value={registre.id.toString()}>
                          {registre.nom} {registre.prenom} - {registre.diagnostic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit_anamnese">Anamnèse</Label>
                  <Textarea
                    id="edit_anamnese"
                    value={formData.anamnese}
                    onChange={(e) => setFormData({...formData, anamnese: e.target.value})}
                    rows={3}
                    required
                    placeholder="Historique médical et symptômes du patient..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_examen">Examen clinique</Label>
                  <Textarea
                    id="edit_examen"
                    value={formData.examen}
                    onChange={(e) => setFormData({...formData, examen: e.target.value})}
                    rows={3}
                    required
                    placeholder="Résultats de l'examen clinique..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.methode_posee}
                      onChange={(e) => setFormData({...formData, methode_posee: e.target.checked})}
                    />
                    <span className="text-sm font-medium">Méthode posée</span>
                  </label>
                </div>
                
                <div>
                  <Label htmlFor="edit_effets_secondaires">Effets secondaires</Label>
                  <Textarea
                    id="edit_effets_secondaires"
                    value={formData.effets_secondaires}
                    onChange={(e) => setFormData({...formData, effets_secondaires: e.target.value})}
                    rows={2}
                    placeholder="Effets secondaires observés ou rapportés..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    placeholder="Notes additionnelles..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_observation">Observations</Label>
                  <Textarea
                    id="edit_observation"
                    value={formData.observation}
                    onChange={(e) => setFormData({...formData, observation: e.target.value})}
                    rows={2}
                    placeholder="Observations générales..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedConsultation(null)
                      resetForm()
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Mettre à jour
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la Consultation
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Patient</h3>
                    <p>{selectedConsultation.patient_nom} {selectedConsultation.patient_prenom}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Spécialiste</h3>
                    <p>{selectedConsultation.specialiste_nom}</p>
                    <p className="text-sm text-gray-600">{selectedConsultation.hopital_nom}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Date de consultation</h3>
                  <p>{formatDate(selectedConsultation.date)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Anamnèse</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedConsultation.anamnese}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Examen clinique</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedConsultation.examen}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Méthode posée</h3>
                  <Badge variant={selectedConsultation.methode_posee ? "default" : "secondary"}>
                    {selectedConsultation.methode_posee ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                
                {selectedConsultation.effets_secondaires && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Effets secondaires</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedConsultation.effets_secondaires}</p>
                  </div>
                )}
                
                {selectedConsultation.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedConsultation.notes}</p>
                  </div>
                )}
                
                {selectedConsultation.observation && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Observations</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedConsultation.observation}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 pt-4 border-t">
                  <div>
                    <p>Créé le: {formatDateTime(selectedConsultation.created_at)}</p>
                  </div>
                  <div>
                    <p>Modifié le: {formatDateTime(selectedConsultation.updated_at)}</p>
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

      {/* Modal de création de rapport */}
      {showRapportModal && selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Créer un Rapport
                </h2>
                <button
                  onClick={() => {
                    setShowRapportModal(false)
                    setSelectedConsultation(null)
                    setRapportData({ titre: '', contenu: '' })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedConsultation.patient_nom} {selectedConsultation.patient_prenom}</p>
                <p className="text-sm text-gray-600">Consultation du {formatDate(selectedConsultation.date)}</p>
              </div>
              
              <form onSubmit={handleCreateRapport} className="space-y-4">
                <div>
                  <Label htmlFor="rapport_titre">Titre du rapport</Label>
                  <Input
                    id="rapport_titre"
                    value={rapportData.titre}
                    onChange={(e) => setRapportData({...rapportData, titre: e.target.value})}
                    required
                    placeholder="Titre du rapport médical..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="rapport_contenu">Contenu du rapport</Label>
                  <Textarea
                    id="rapport_contenu"
                    value={rapportData.contenu}
                    onChange={(e) => setRapportData({...rapportData, contenu: e.target.value})}
                    rows={10}
                    required
                    placeholder="Rédigez le contenu détaillé du rapport médical..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRapportModal(false)
                      setSelectedConsultation(null)
                      setRapportData({ titre: '', contenu: '' })
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Créer le Rapport
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}