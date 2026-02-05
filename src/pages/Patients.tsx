import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  Users, 
  Plus, 
  Edit,
  Eye,
  Search,
  X
} from 'lucide-react'
import { 
  patientService,
  authService,
  type Patient
} from '../services/api'
import { formatDate } from '../lib/utils'

export const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSexe, setSelectedSexe] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    sexe: 'M' as 'M' | 'F',
    age: 0,
    date_naissance: '',
    adresse: '',
    ville: '',
    pays: 'Cameroun',
    telephone: '',
    numero_cni: '',
    numero_cne: '',
    profession: '',
    ethnie: ''
  })

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const patientsData = await patientService.getAll({
        sexe: selectedSexe || undefined,
        search: searchTerm || undefined
      })
      
      console.log('Données patients reçues:', patientsData)
      const patientsArray = Array.isArray(patientsData) ? patientsData : patientsData.results || []
      setPatients(patientsArray)
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des patients:', error)
      
      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
        return
      }
      
      // Gestion des erreurs de permissions
      if (error.response?.status === 403) {
        alert('Vous n\'avez pas les permissions nécessaires pour accéder à ces données.')
        return
      }
      
      // Autres erreurs
      alert('Erreur lors du chargement des patients. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const patientData = {
        ...formData,
        age: parseInt(formData.age.toString())
      }
      
      await patientService.create(patientData)
      await loadData()
      setShowCreateModal(false)
      resetForm()
      
    } catch (error: any) {
      console.error('Erreur lors de la création du patient:', error)
      
      if (error.response?.data) {
        const errors = Object.entries(error.response.data)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n')
        alert(`Erreurs de validation:\n${errors}`)
      } else {
        alert('Erreur lors de la création du patient')
      }
    }
  }

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient) return
    
    try {
      const patientData = {
        ...formData,
        age: parseInt(formData.age.toString())
      }
      
      await patientService.update(selectedPatient.id, patientData)
      await loadData()
      setShowEditModal(false)
      setSelectedPatient(null)
      resetForm()
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du patient:', error)
      
      if (error.response?.data) {
        const errors = Object.entries(error.response.data)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n')
        alert(`Erreurs de validation:\n${errors}`)
      } else {
        alert('Erreur lors de la mise à jour du patient')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      sexe: 'M',
      age: 0,
      date_naissance: '',
      adresse: '',
      ville: '',
      pays: 'Cameroun',
      telephone: '',
      numero_cni: '',
      numero_cne: '',
      profession: '',
      ethnie: ''
    })
  }

  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData({
      nom: patient.nom,
      prenom: patient.prenom,
      email: patient.email || '',
      password: '', // Ne pas pré-remplir le mot de passe
      sexe: patient.sexe,
      age: patient.age,
      date_naissance: patient.date_naissance || '',
      adresse: patient.adresse || '',
      ville: patient.ville || '',
      pays: patient.pays || 'Cameroun',
      telephone: patient.telephone || '',
      numero_cni: patient.numero_cni || '',
      numero_cne: patient.numero_cne || '',
      profession: patient.profession || '',
      ethnie: patient.ethnie || ''
    })
    setShowEditModal(true)
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = (patient.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (patient.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (patient.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (patient.telephone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesSexe = selectedSexe === '' || patient.sexe === selectedSexe
    
    return matchesSearch && matchesSexe
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
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">
            Gestion des patients de l'hôpital
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Patient
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hommes</p>
                <p className="text-2xl font-bold">
                  {patients.filter(p => p.sexe === 'M').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Femmes</p>
                <p className="text-2xl font-bold">
                  {patients.filter(p => p.sexe === 'F').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
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
                  placeholder="Rechercher par nom, prénom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedSexe} onValueChange={setSelectedSexe}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="M">Hommes</SelectItem>
                <SelectItem value="F">Femmes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des patients */}
      <Card>
        <CardHeader>
          <CardTitle>Patients ({filteredPatients.length})</CardTitle>
          <CardDescription>
            Liste des patients enregistrés dans l'hôpital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead>Âge</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucun patient trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{patient.nom} {patient.prenom}</p>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={patient.sexe === 'M' ? 'default' : 'secondary'}>
                          {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                        </Badge>
                      </TableCell>
                      <TableCell>{patient.age} ans</TableCell>
                      <TableCell>
                        <div>
                          {patient.telephone && (
                            <p className="text-sm">{patient.telephone}</p>
                          )}
                          {patient.adresse && (
                            <p className="text-sm text-gray-500">{patient.adresse}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={patient.actif ? 'default' : 'destructive'}>
                          {patient.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient)
                              setShowDetailsModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(patient)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Nouveau Patient</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePatient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sexe">Sexe *</Label>
                  <Select value={formData.sexe} onValueChange={(value: 'M' | 'F') => setFormData({...formData, sexe: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Homme</SelectItem>
                      <SelectItem value="F">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="age">Âge *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                    required
                    min="0"
                    max="120"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_cni">Numéro CNI</Label>
                  <Input
                    id="numero_cni"
                    value={formData.numero_cni}
                    onChange={(e) => setFormData({...formData, numero_cni: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="numero_cne">Numéro CNE</Label>
                  <Input
                    id="numero_cne"
                    value={formData.numero_cne}
                    onChange={(e) => setFormData({...formData, numero_cne: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({...formData, profession: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ethnie">Ethnie</Label>
                  <Input
                    id="ethnie"
                    value={formData.ethnie}
                    onChange={(e) => setFormData({...formData, ethnie: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  Créer le Patient
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Modifier Patient</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePatient} className="p-6 space-y-4">
              {/* Même formulaire que pour la création, mais sans le mot de passe obligatoire */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Nouveau mot de passe (optionnel)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Laisser vide pour ne pas changer"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sexe">Sexe *</Label>
                  <Select value={formData.sexe} onValueChange={(value: 'M' | 'F') => setFormData({...formData, sexe: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Homme</SelectItem>
                      <SelectItem value="F">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="age">Âge *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                    required
                    min="0"
                    max="120"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_cni">Numéro CNI</Label>
                  <Input
                    id="numero_cni"
                    value={formData.numero_cni}
                    onChange={(e) => setFormData({...formData, numero_cni: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="numero_cne">Numéro CNE</Label>
                  <Input
                    id="numero_cne"
                    value={formData.numero_cne}
                    onChange={(e) => setFormData({...formData, numero_cne: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({...formData, profession: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ethnie">Ethnie</Label>
                  <Input
                    id="ethnie"
                    value={formData.ethnie}
                    onChange={(e) => setFormData({...formData, ethnie: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  Mettre à jour
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Détails du Patient</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom complet</Label>
                  <p className="font-medium">{selectedPatient.nom} {selectedPatient.prenom}</p>
                </div>
                
                <div>
                  <Label>Email</Label>
                  <p>{selectedPatient.email || 'Non renseigné'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Sexe</Label>
                  <p>{selectedPatient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
                </div>
                
                <div>
                  <Label>Âge</Label>
                  <p>{selectedPatient.age} ans</p>
                </div>
                
                <div>
                  <Label>Téléphone</Label>
                  <p>{selectedPatient.telephone || 'Non renseigné'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Numéro CNI</Label>
                  <p>{selectedPatient.numero_cni || 'Non renseigné'}</p>
                </div>
                
                <div>
                  <Label>Numéro CNE</Label>
                  <p>{selectedPatient.numero_cne || 'Non renseigné'}</p>
                </div>
              </div>
              
              <div>
                <Label>Adresse</Label>
                <p>{selectedPatient.adresse || 'Non renseignée'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Profession</Label>
                  <p>{selectedPatient.profession || 'Non renseignée'}</p>
                </div>
                
                <div>
                  <Label>Ethnie</Label>
                  <p>{selectedPatient.ethnie || 'Non renseignée'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Statut</Label>
                  <Badge variant={selectedPatient.actif ? 'default' : 'destructive'}>
                    {selectedPatient.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                <div>
                  <Label>Date d'inscription</Label>
                  <p>{formatDate(selectedPatient.created_at)}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    openEditModal(selectedPatient)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}