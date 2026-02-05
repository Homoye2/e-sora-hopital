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
  Plus, 
  Edit,
  Trash2,
  Search,
  Star,
  X
} from 'lucide-react'
import { 
  specialisteService,
  specialiteService,
  hopitalService,
  type Specialiste,
  type Specialite,
  type Hopital
} from '../services/api'
import { formatCurrency } from '../lib/utils'

export const Specialistes = () => {
  const [specialistes, setSpecialistes] = useState<Specialiste[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [hopital, setHopital] = useState<Hopital | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialite, setSelectedSpecialite] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSpecialiste, setSelectedSpecialiste] = useState<Specialiste | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    specialite: '',
    numero_ordre: '',
    titre: 'Dr',
    annees_experience: 0,
    bio: '',
    tarif_consultation: 0,
    duree_consultation: 30,
    accepte_nouveaux_patients: true,
    consultation_en_ligne: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger l'hôpital
      const hopitalData = await hopitalService.getMyHopital()
      setHopital(hopitalData)
      
      // Charger les spécialistes de l'hôpital
      const specialistesData = await specialisteService.getAll(hopitalData.id)
      console.log('Données spécialistes reçues:', specialistesData)
      const specialistesArray = Array.isArray(specialistesData) ? specialistesData : specialistesData.results || []
      setSpecialistes(specialistesArray)
      
      // Charger toutes les spécialités
      const specialitesData = await specialiteService.getAll()
      console.log('Données spécialités reçues:', specialitesData)
      const specialitesArray = Array.isArray(specialitesData) ? specialitesData : specialitesData.results || []
      setSpecialites(specialitesArray)
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error)
      
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
      alert('Erreur lors du chargement des données. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSpecialiste = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!hopital) return
      
      const newSpecialiste = {
        ...formData,
        hopital: hopital.id,
        specialite: parseInt(formData.specialite)
      }
      
      await specialisteService.create(newSpecialiste)
      await loadData()
      setShowCreateModal(false)
      resetForm()
      
    } catch (error) {
      console.error('Erreur lors de la création du spécialiste:', error)
      alert('Erreur lors de la création du spécialiste')
    }
  }

  const handleUpdateSpecialiste = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSpecialiste) return
    
    try {
      // Send all form data to the new complete update endpoint
      const updatedData = {
        nom: formData.nom,
        email: formData.email,
        password: formData.password || undefined, // Only send if not empty
        specialite: parseInt(formData.specialite),
        numero_ordre: formData.numero_ordre,
        titre: formData.titre,
        annees_experience: formData.annees_experience,
        bio: formData.bio,
        tarif_consultation: formData.tarif_consultation,
        duree_consultation: formData.duree_consultation,
        accepte_nouveaux_patients: formData.accepte_nouveaux_patients,
        consultation_en_ligne: formData.consultation_en_ligne
      }
      
      await specialisteService.updateComplete(selectedSpecialiste.id, updatedData)
      await loadData()
      setShowEditModal(false)
      setSelectedSpecialiste(null)
      resetForm()
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du spécialiste:', error)
      alert('Erreur lors de la mise à jour du spécialiste')
    }
  }

  const handleDeleteSpecialiste = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce spécialiste ?')) return
    
    try {
      await specialisteService.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erreur lors de la suppression du spécialiste:', error)
      alert('Erreur lors de la suppression du spécialiste')
    }
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      email: '',
      password: '',
      specialite: '',
      numero_ordre: '',
      titre: 'Dr',
      annees_experience: 0,
      bio: '',
      tarif_consultation: 0,
      duree_consultation: 30,
      accepte_nouveaux_patients: true,
      consultation_en_ligne: false
    })
  }

  const openEditModal = (specialiste: Specialiste) => {
    setSelectedSpecialiste(specialiste)
    setFormData({
      nom: specialiste.user_nom,
      email: specialiste.user_email,
      password: '',
      specialite: specialiste.specialite.toString(),
      numero_ordre: specialiste.numero_ordre,
      titre: specialiste.titre,
      annees_experience: specialiste.annees_experience,
      bio: specialiste.bio,
      tarif_consultation: specialiste.tarif_consultation,
      duree_consultation: specialiste.duree_consultation,
      accepte_nouveaux_patients: specialiste.accepte_nouveaux_patients,
      consultation_en_ligne: specialiste.consultation_en_ligne
    })
    setShowEditModal(true)
  }

  const filteredSpecialistes = specialistes.filter(specialiste => {
    const matchesSearch = specialiste.user_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         specialiste.specialite_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         specialiste.numero_ordre.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialite = selectedSpecialite === 'all' || selectedSpecialite === '' || 
                             specialiste.specialite.toString() === selectedSpecialite
    
    return matchesSearch && matchesSpecialite
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Spécialistes</h1>
          <p className="text-gray-600">
            Gérez les spécialistes de {hopital?.nom}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un Spécialiste
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, spécialité ou numéro d'ordre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedSpecialite} onValueChange={setSelectedSpecialite}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Toutes les spécialités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les spécialités</SelectItem>
                {specialites.map((specialite) => (
                  <SelectItem key={specialite.id} value={specialite.id.toString()}>
                    {specialite.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des spécialistes */}
      <Card>
        <CardHeader>
          <CardTitle>Spécialistes ({filteredSpecialistes.length})</CardTitle>
          <CardDescription>
            Liste de tous les spécialistes de l'hôpital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spécialiste</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>N° Ordre</TableHead>
                  <TableHead>Expérience</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpecialistes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucun spécialiste trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSpecialistes.map((specialiste) => (
                    <TableRow key={specialiste.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{specialiste.titre} {specialiste.user_nom}</p>
                          <p className="text-sm text-gray-500">{specialiste.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{specialiste.specialite_nom}</TableCell>
                      <TableCell className="font-mono text-sm">{specialiste.numero_ordre}</TableCell>
                      <TableCell>{specialiste.annees_experience} ans</TableCell>
                      <TableCell>{formatCurrency(specialiste.tarif_consultation)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{Number(specialiste.note_moyenne).toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({specialiste.nombre_avis})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={specialiste.actif ? "default" : "secondary"}>
                          {specialiste.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(specialiste)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSpecialiste(specialiste.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Ajouter un Spécialiste
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
              
              <form onSubmit={handleCreateSpecialiste} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom complet</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="titre">Titre</Label>
                    <Select value={formData.titre} onValueChange={(value) => setFormData({...formData, titre: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Pr">Pr</SelectItem>
                        <SelectItem value="Dr/Pr">Dr/Pr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialite">Spécialité</Label>
                    <Select value={formData.specialite} onValueChange={(value) => setFormData({...formData, specialite: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une spécialité" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialites.map((specialite) => (
                          <SelectItem key={specialite.id} value={specialite.id.toString()}>
                            {specialite.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="numero_ordre">Numéro d'ordre</Label>
                    <Input
                      id="numero_ordre"
                      value={formData.numero_ordre}
                      onChange={(e) => setFormData({...formData, numero_ordre: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="annees_experience">Années d'expérience</Label>
                    <Input
                      id="annees_experience"
                      type="number"
                      min="0"
                      value={formData.annees_experience}
                      onChange={(e) => setFormData({...formData, annees_experience: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tarif_consultation">Tarif consultation (FCFA)</Label>
                    <Input
                      id="tarif_consultation"
                      type="number"
                      min="0"
                      value={formData.tarif_consultation}
                      onChange={(e) => setFormData({...formData, tarif_consultation: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duree_consultation">Durée consultation (min)</Label>
                    <Input
                      id="duree_consultation"
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duree_consultation}
                      onChange={(e) => setFormData({...formData, duree_consultation: parseInt(e.target.value) || 30})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.accepte_nouveaux_patients}
                      onChange={(e) => setFormData({...formData, accepte_nouveaux_patients: e.target.checked})}
                    />
                    <span className="text-sm">Accepte de nouveaux patients</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.consultation_en_ligne}
                      onChange={(e) => setFormData({...formData, consultation_en_ligne: e.target.checked})}
                    />
                    <span className="text-sm">Consultation en ligne</span>
                  </label>
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
                    Créer le Spécialiste
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedSpecialiste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Modifier le Spécialiste
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedSpecialiste(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateSpecialiste} className="space-y-4">
                {/* Même formulaire que pour la création, mais sans le mot de passe obligatoire */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_nom">Nom complet</Label>
                    <Input
                      id="edit_nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_password">Nouveau mot de passe (optionnel)</Label>
                    <Input
                      id="edit_password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Laisser vide pour ne pas changer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_titre">Titre</Label>
                    <Select value={formData.titre} onValueChange={(value) => setFormData({...formData, titre: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Pr">Pr</SelectItem>
                        <SelectItem value="Dr/Pr">Dr/Pr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_specialite">Spécialité</Label>
                    <Select value={formData.specialite} onValueChange={(value) => setFormData({...formData, specialite: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une spécialité" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialites.map((specialite) => (
                          <SelectItem key={specialite.id} value={specialite.id.toString()}>
                            {specialite.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_numero_ordre">Numéro d'ordre</Label>
                    <Input
                      id="edit_numero_ordre"
                      value={formData.numero_ordre}
                      onChange={(e) => setFormData({...formData, numero_ordre: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_annees_experience">Années d'expérience</Label>
                    <Input
                      id="edit_annees_experience"
                      type="number"
                      min="0"
                      value={formData.annees_experience}
                      onChange={(e) => setFormData({...formData, annees_experience: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_tarif_consultation">Tarif consultation (FCFA)</Label>
                    <Input
                      id="edit_tarif_consultation"
                      type="number"
                      min="0"
                      value={formData.tarif_consultation}
                      onChange={(e) => setFormData({...formData, tarif_consultation: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_duree_consultation">Durée consultation (min)</Label>
                    <Input
                      id="edit_duree_consultation"
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duree_consultation}
                      onChange={(e) => setFormData({...formData, duree_consultation: parseInt(e.target.value) || 30})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit_bio">Biographie</Label>
                  <Textarea
                    id="edit_bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.accepte_nouveaux_patients}
                      onChange={(e) => setFormData({...formData, accepte_nouveaux_patients: e.target.checked})}
                    />
                    <span className="text-sm">Accepte de nouveaux patients</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.consultation_en_ligne}
                      onChange={(e) => setFormData({...formData, consultation_en_ligne: e.target.checked})}
                    />
                    <span className="text-sm">Consultation en ligne</span>
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedSpecialiste(null)
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
    </div>
  )
}