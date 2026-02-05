import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { 
  Clock, 
  Plus, 
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  Save
} from 'lucide-react'
import { 
  disponibiliteService,
  authService,
  specialisteService,
  type DisponibiliteSpecialiste
} from '../services/api'

const joursSemine = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
  { value: 'samedi', label: 'Samedi' },
  { value: 'dimanche', label: 'Dimanche' }
]

export const Disponibilites = () => {
  const [disponibilites, setDisponibilites] = useState<DisponibiliteSpecialiste[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedDisponibilite, setSelectedDisponibilite] = useState<DisponibiliteSpecialiste | null>(null)
  const [formData, setFormData] = useState({
    jour_semaine: '',
    heure_debut: '',
    heure_fin: '',
    date_debut_exception: '',
    date_fin_exception: '',
    motif_exception: '',
    actif: true
  })
  const [bulkData, setBulkData] = useState({
    lundi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
    mardi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
    mercredi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
    jeudi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
    vendredi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
    samedi: { actif: false, heure_debut: '08:00', heure_fin: '12:00' },
    dimanche: { actif: false, heure_debut: '08:00', heure_fin: '12:00' }
  })

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser && currentUser.role === 'specialiste') {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les disponibilités du spécialiste connecté
      const disponibilitesData = await disponibiliteService.getAll()
      const disponibilitesArray = Array.isArray(disponibilitesData) ? disponibilitesData : disponibilitesData.results || []
      setDisponibilites(disponibilitesArray)
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDisponibilite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Récupérer l'utilisateur connecté pour obtenir l'ID du spécialiste
      const currentUser = authService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'specialiste') {
        alert('Erreur: Utilisateur non autorisé')
        return
      }

      // Récupérer les données du spécialiste pour obtenir le bon ID
      let specialisteData
      try {
        specialisteData = await specialisteService.getMe()
      } catch (error) {
        console.error('Erreur lors de la récupération des données du spécialiste:', error)
        alert('Erreur: Impossible de récupérer vos données de spécialiste. Veuillez vous reconnecter.')
        return
      }

      // Vérifier si une disponibilité existe déjà pour ce jour et cette heure
      const existingDisponibilites = disponibilites.filter(d => 
        d.jour_semaine === formData.jour_semaine && 
        d.heure_debut === formData.heure_debut
      )

      if (existingDisponibilites.length > 0) {
        alert(`Une disponibilité existe déjà pour ${formData.jour_semaine} à ${formData.heure_debut}. Veuillez choisir un autre créneau ou modifier la disponibilité existante.`)
        return
      }

      // Préparer les données avec le spécialiste et nettoyer les dates vides
      const dataToSend = {
        ...formData,
        specialiste: specialisteData.id, // Utiliser l'ID du spécialiste récupéré
        // Nettoyer les dates d'exception vides
        date_debut_exception: formData.date_debut_exception || null,
        date_fin_exception: formData.date_fin_exception || null,
        motif_exception: formData.motif_exception || ''
      }

      // Supprimer les champs null pour éviter les erreurs de validation
      if (!dataToSend.date_debut_exception) {
        delete dataToSend.date_debut_exception
      }
      if (!dataToSend.date_fin_exception) {
        delete dataToSend.date_fin_exception
      }

      console.log('Données à envoyer:', dataToSend)

      await disponibiliteService.create(dataToSend)
      await loadData()
      setShowCreateModal(false)
      resetForm()
      
    } catch (error) {
      console.error('Erreur lors de la création de la disponibilité:', error)
      
      // Afficher les erreurs de validation spécifiques
      if (error.response?.data) {
        const errors = error.response.data
        let errorMessage = 'Erreur lors de la création de la disponibilité:\n'
        
        if (errors.specialiste && Array.isArray(errors.specialiste)) {
          errorMessage += `Spécialiste: ${errors.specialiste.join(', ')}\n`
        }
        
        if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
          errorMessage += `${errors.non_field_errors.join(', ')}\n`
          
          // Message spécifique pour les doublons
          if (errors.non_field_errors.some(err => err.includes('unique'))) {
            errorMessage += '\n💡 Conseil: Une disponibilité existe déjà pour ce jour et cette heure. Veuillez:\n'
            errorMessage += '   - Choisir un autre créneau horaire\n'
            errorMessage += '   - Ou modifier la disponibilité existante\n'
            errorMessage += '   - Ou supprimer l\'ancienne avant de créer la nouvelle'
          }
        }
        
        Object.keys(errors).forEach(field => {
          if (field !== 'specialiste' && field !== 'non_field_errors' && Array.isArray(errors[field])) {
            errorMessage += `${field}: ${errors[field].join(', ')}\n`
          }
        })
        
        alert(errorMessage)
      } else {
        alert('Erreur lors de la création de la disponibilité')
      }
    }
  }

  const handleUpdateDisponibilite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDisponibilite) return
    
    try {
      // Récupérer l'utilisateur connecté pour obtenir l'ID du spécialiste
      const currentUser = authService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'specialiste') {
        alert('Erreur: Utilisateur non autorisé')
        return
      }

      // Récupérer les données du spécialiste pour obtenir le bon ID
      let specialisteData
      try {
        specialisteData = await specialisteService.getMe()
      } catch (error) {
        console.error('Erreur lors de la récupération des données du spécialiste:', error)
        alert('Erreur: Impossible de récupérer vos données de spécialiste. Veuillez vous reconnecter.')
        return
      }

      // Préparer les données avec le spécialiste et nettoyer les dates vides
      const dataToSend = {
        ...formData,
        specialiste: specialisteData.id, // Utiliser l'ID du spécialiste récupéré
        // Nettoyer les dates d'exception vides
        date_debut_exception: formData.date_debut_exception || null,
        date_fin_exception: formData.date_fin_exception || null,
        motif_exception: formData.motif_exception || ''
      }

      // Supprimer les champs null pour éviter les erreurs de validation
      if (!dataToSend.date_debut_exception) {
        delete dataToSend.date_debut_exception
      }
      if (!dataToSend.date_fin_exception) {
        delete dataToSend.date_fin_exception
      }

      console.log('Données à envoyer pour la mise à jour:', dataToSend)

      await disponibiliteService.update(selectedDisponibilite.id, dataToSend)
      await loadData()
      setShowEditModal(false)
      setSelectedDisponibilite(null)
      resetForm()
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la disponibilité:', error)
      
      // Afficher les erreurs de validation spécifiques
      if (error.response?.data) {
        const errors = error.response.data
        let errorMessage = 'Erreur lors de la mise à jour de la disponibilité:\n'
        
        if (errors.specialiste && Array.isArray(errors.specialiste)) {
          errorMessage += `Spécialiste: ${errors.specialiste.join(', ')}\n`
        }
        
        if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
          errorMessage += `${errors.non_field_errors.join(', ')}\n`
        }
        
        Object.keys(errors).forEach(field => {
          if (field !== 'specialiste' && field !== 'non_field_errors' && Array.isArray(errors[field])) {
            errorMessage += `${field}: ${errors[field].join(', ')}\n`
          }
        })
        
        alert(errorMessage)
      } else {
        alert('Erreur lors de la mise à jour de la disponibilité')
      }
    }
  }

  const handleDeleteDisponibilite = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return
    
    try {
      await disponibiliteService.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erreur lors de la suppression de la disponibilité:', error)
      alert('Erreur lors de la suppression de la disponibilité')
    }
  }

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Récupérer l'utilisateur connecté pour obtenir l'ID du spécialiste
      const currentUser = authService.getCurrentUser()
      if (!currentUser || currentUser.role !== 'specialiste') {
        alert('Erreur: Utilisateur non autorisé')
        return
      }

      // Récupérer les données du spécialiste pour obtenir le bon ID
      let specialisteData
      try {
        specialisteData = await specialisteService.getMe()
      } catch (error) {
        console.error('Erreur lors de la récupération des données du spécialiste:', error)
        alert('Erreur: Impossible de récupérer vos données de spécialiste. Veuillez vous reconnecter.')
        return
      }

      const disponibilitesToCreate = Object.entries(bulkData)
        .filter(([_, data]) => data.actif)
        .map(([jour, data]) => ({
          specialiste: specialisteData.id, // Utiliser l'ID du spécialiste récupéré
          jour_semaine: jour,
          heure_debut: data.heure_debut,
          heure_fin: data.heure_fin,
          actif: true
        }))
      
      if (disponibilitesToCreate.length === 0) {
        alert('Veuillez sélectionner au moins un jour')
        return
      }

      // Vérifier les doublons avec les disponibilités existantes
      const duplicates = []
      const conflictDetails = []
      
      for (const newDispo of disponibilitesToCreate) {
        // Normaliser les heures pour la comparaison (enlever les secondes si présentes)
        const normalizeTime = (time) => {
          if (typeof time === 'string') {
            return time.substring(0, 5) // Garder seulement HH:MM
          }
          return time
        }
        
        const existing = disponibilites.find(d => 
          d.jour_semaine === newDispo.jour_semaine && 
          normalizeTime(d.heure_debut) === normalizeTime(newDispo.heure_debut)
        )
        
        if (existing) {
          duplicates.push(`${newDispo.jour_semaine} à ${newDispo.heure_debut}`)
          conflictDetails.push({
            jour: newDispo.jour_semaine,
            heure: newDispo.heure_debut,
            existingId: existing.id,
            existingHoraires: `${existing.heure_debut} - ${existing.heure_fin}`
          })
        }
      }

      if (duplicates.length > 0) {
        let message = `❌ Des disponibilités existent déjà pour:\n\n`
        conflictDetails.forEach(conflict => {
          message += `• ${conflict.jour} à ${conflict.heure} (actuellement: ${conflict.existingHoraires})\n`
        })
        message += `\n💡 Solutions possibles:\n`
        message += `1. Décochez les jours en conflit dans le planning\n`
        message += `2. Modifiez les heures pour éviter les conflits\n`
        message += `3. Supprimez les disponibilités existantes d'abord\n`
        message += `4. Utilisez la fonction "Modifier" pour les créneaux existants`
        
        alert(message)
        return
      }

      console.log('Disponibilités à créer:', disponibilitesToCreate)
      
      await disponibiliteService.bulkCreate(disponibilitesToCreate)
      await loadData()
      setShowBulkModal(false)
      
      // Message de succès
      alert(`✅ Planning créé avec succès!\n${disponibilitesToCreate.length} disponibilité(s) ajoutée(s).`)
      
    } catch (error) {
      console.error('Erreur lors de la création en lot:', error)
      
      // Afficher les erreurs de validation spécifiques
      if (error.response?.data) {
        const errors = error.response.data
        let errorMessage = 'Erreur lors de la création des disponibilités:\n\n'
        
        if (errors.errors && errors.errors.non_field_errors && Array.isArray(errors.errors.non_field_errors)) {
          errorMessage += `${errors.errors.non_field_errors.join(', ')}\n`
        } else if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
          errorMessage += `${errors.non_field_errors.join(', ')}\n`
        } else if (typeof errors === 'string') {
          errorMessage += errors
        } else {
          Object.keys(errors).forEach(field => {
            if (Array.isArray(errors[field])) {
              errorMessage += `${field}: ${errors[field].join(', ')}\n`
            }
          })
        }
        
        // Ajouter des conseils spécifiques pour les erreurs de doublons
        if (errorMessage.includes('unique') || errorMessage.includes('doivent former un ensemble unique')) {
          errorMessage += `\n💡 Cette erreur indique qu'une ou plusieurs disponibilités existent déjà.\n`
          errorMessage += `Vérifiez vos disponibilités actuelles et:\n`
          errorMessage += `• Décochez les jours qui ont déjà des créneaux\n`
          errorMessage += `• Ou modifiez les heures pour éviter les conflits\n`
          errorMessage += `• Ou supprimez les anciennes disponibilités d'abord`
        }
        
        alert(errorMessage)
      } else {
        alert('Erreur lors de la création des disponibilités')
      }
    }
  }

  const resetForm = () => {
    // Obtenir la date du jour au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]
    
    setFormData({
      jour_semaine: '',
      heure_debut: '',
      heure_fin: '',
      date_debut_exception: '',
      date_fin_exception: '',
      motif_exception: '',
      actif: true
    })
  }

  // Fonction pour initialiser le planning hebdomadaire avec la date du jour
  const initializeBulkData = () => {
    const today = new Date().toISOString().split('T')[0]
    
    setBulkData({
      lundi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
      mardi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
      mercredi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
      jeudi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
      vendredi: { actif: false, heure_debut: '08:00', heure_fin: '17:00' },
      samedi: { actif: false, heure_debut: '08:00', heure_fin: '12:00' },
      dimanche: { actif: false, heure_debut: '08:00', heure_fin: '12:00' }
    })
  }

  // Fonction pour vérifier si un jour a déjà des disponibilités
  const hasExistingAvailability = (jour: string, heure_debut: string) => {
    const normalizeTime = (time: string) => {
      if (typeof time === 'string') {
        return time.substring(0, 5) // Garder seulement HH:MM
      }
      return time
    }
    
    return disponibilites.some(d => 
      d.jour_semaine === jour && 
      normalizeTime(d.heure_debut) === normalizeTime(heure_debut)
    )
  }

  // Fonction pour obtenir les disponibilités existantes d'un jour
  const getExistingAvailabilities = (jour: string) => {
    return disponibilites.filter(d => d.jour_semaine === jour)
  }

  const openEditModal = (disponibilite: DisponibiliteSpecialiste) => {
    setSelectedDisponibilite(disponibilite)
    setFormData({
      jour_semaine: disponibilite.jour_semaine,
      heure_debut: disponibilite.heure_debut,
      heure_fin: disponibilite.heure_fin,
      date_debut_exception: disponibilite.date_debut_exception || '',
      date_fin_exception: disponibilite.date_fin_exception || '',
      motif_exception: disponibilite.motif_exception,
      actif: disponibilite.actif
    })
    setShowEditModal(true)
  }

  // Grouper les disponibilités par jour
  const disponibilitesParJour = disponibilites.reduce((acc, disp) => {
    if (!acc[disp.jour_semaine]) {
      acc[disp.jour_semaine] = []
    }
    acc[disp.jour_semaine].push(disp)
    return acc
  }, {} as Record<string, DisponibiliteSpecialiste[]>)

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
          <h1 className="text-3xl font-bold text-gray-900">Mes Disponibilités</h1>
          <p className="text-gray-600">
            Gérez vos créneaux de disponibilité pour les rendez-vous
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              initializeBulkData()
              setShowBulkModal(true)
            }}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Planning Hebdomadaire
          </Button>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un Créneau
          </Button>
        </div>
      </div>

      {/* Vue par jour de la semaine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {joursSemine.map((jour) => {
          const disponibilitesJour = disponibilitesParJour[jour.value] || []
          
          return (
            <Card key={jour.value}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{jour.label}</span>
                  <Badge variant={disponibilitesJour.length > 0 ? "default" : "secondary"}>
                    {disponibilitesJour.length} créneau{disponibilitesJour.length > 1 ? 'x' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {disponibilitesJour.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Aucune disponibilité définie
                  </p>
                ) : (
                  <div className="space-y-3">
                    {disponibilitesJour.map((disp) => (
                      <div key={disp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {disp.heure_debut} - {disp.heure_fin}
                            </span>
                            <Badge variant={disp.actif ? "default" : "secondary"} className="ml-2">
                              {disp.actif ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          
                          {disp.date_debut_exception && (
                            <div className="mt-1 text-sm text-orange-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Exception: {disp.date_debut_exception} 
                              {disp.date_fin_exception && ` - ${disp.date_fin_exception}`}
                            </div>
                          )}
                          
                          {disp.motif_exception && (
                            <p className="text-xs text-gray-600 mt-1">
                              {disp.motif_exception}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(disp)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDisponibilite(disp.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Résumé des disponibilités */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de la Semaine</CardTitle>
          <CardDescription>
            Vue d'ensemble de vos disponibilités hebdomadaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {joursSemine.map((jour) => {
              const disponibilitesJour = disponibilitesParJour[jour.value] || []
              const totalHeures = disponibilitesJour.reduce((total, disp) => {
                if (!disp.actif) return total
                const debut = new Date(`2000-01-01T${disp.heure_debut}`)
                const fin = new Date(`2000-01-01T${disp.heure_fin}`)
                return total + (fin.getTime() - debut.getTime()) / (1000 * 60 * 60)
              }, 0)
              
              return (
                <div key={jour.value} className="text-center p-3 border rounded-lg">
                  <p className="font-medium text-sm">{jour.label.substring(0, 3)}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {totalHeures > 0 ? `${totalHeures}h` : 'Fermé'}
                  </p>
                  <div className={`w-2 h-2 rounded-full mx-auto mt-2 ${
                    totalHeures > 0 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Ajouter un Créneau
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
              
              <form onSubmit={handleCreateDisponibilite} className="space-y-4">
                <div>
                  <Label htmlFor="jour_semaine">Jour de la semaine</Label>
                  <Select value={formData.jour_semaine} onValueChange={(value) => setFormData({...formData, jour_semaine: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {joursSemine.map((jour) => (
                        <SelectItem key={jour.value} value={jour.value}>
                          {jour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="heure_debut">Heure de début</Label>
                    <Input
                      id="heure_debut"
                      type="time"
                      value={formData.heure_debut}
                      onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="heure_fin">Heure de fin</Label>
                    <Input
                      id="heure_fin"
                      type="time"
                      value={formData.heure_fin}
                      onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_debut_exception">Exception début (optionnel)</Label>
                    <Input
                      id="date_debut_exception"
                      type="date"
                      value={formData.date_debut_exception}
                      onChange={(e) => setFormData({...formData, date_debut_exception: e.target.value})}
                      min={new Date().toISOString().split('T')[0]} // Date minimum = aujourd'hui
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_fin_exception">Exception fin (optionnel)</Label>
                    <Input
                      id="date_fin_exception"
                      type="date"
                      value={formData.date_fin_exception}
                      onChange={(e) => setFormData({...formData, date_fin_exception: e.target.value})}
                      min={formData.date_debut_exception || new Date().toISOString().split('T')[0]} // Date minimum = date début ou aujourd'hui
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="motif_exception">Motif d'exception (optionnel)</Label>
                  <Textarea
                    id="motif_exception"
                    value={formData.motif_exception}
                    onChange={(e) => setFormData({...formData, motif_exception: e.target.value})}
                    rows={2}
                    placeholder="Raison de l'exception (congés, formation, etc.)"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.actif}
                      onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    />
                    <span className="text-sm font-medium">Créneau actif</span>
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
                    Créer le Créneau
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedDisponibilite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Modifier le Créneau
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedDisponibilite(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateDisponibilite} className="space-y-4">
                <div>
                  <Label htmlFor="edit_jour_semaine">Jour de la semaine</Label>
                  <Select value={formData.jour_semaine} onValueChange={(value) => setFormData({...formData, jour_semaine: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {joursSemine.map((jour) => (
                        <SelectItem key={jour.value} value={jour.value}>
                          {jour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_heure_debut">Heure de début</Label>
                    <Input
                      id="edit_heure_debut"
                      type="time"
                      value={formData.heure_debut}
                      onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_heure_fin">Heure de fin</Label>
                    <Input
                      id="edit_heure_fin"
                      type="time"
                      value={formData.heure_fin}
                      onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_date_debut_exception">Exception début (optionnel)</Label>
                    <Input
                      id="edit_date_debut_exception"
                      type="date"
                      value={formData.date_debut_exception}
                      onChange={(e) => setFormData({...formData, date_debut_exception: e.target.value})}
                      min={new Date().toISOString().split('T')[0]} // Date minimum = aujourd'hui
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_date_fin_exception">Exception fin (optionnel)</Label>
                    <Input
                      id="edit_date_fin_exception"
                      type="date"
                      value={formData.date_fin_exception}
                      onChange={(e) => setFormData({...formData, date_fin_exception: e.target.value})}
                      min={formData.date_debut_exception || new Date().toISOString().split('T')[0]} // Date minimum = date début ou aujourd'hui
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit_motif_exception">Motif d'exception (optionnel)</Label>
                  <Textarea
                    id="edit_motif_exception"
                    value={formData.motif_exception}
                    onChange={(e) => setFormData({...formData, motif_exception: e.target.value})}
                    rows={2}
                    placeholder="Raison de l'exception (congés, formation, etc.)"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.actif}
                      onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    />
                    <span className="text-sm font-medium">Créneau actif</span>
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedDisponibilite(null)
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

      {/* Modal de création en lot */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Planning Hebdomadaire
                </h2>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleBulkCreate} className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Définissez vos horaires pour chaque jour de la semaine. Seuls les jours cochés seront créés.
                </p>
                
                {joursSemine.map((jour) => {
                  const existingAvailabilities = getExistingAvailabilities(jour.value)
                  const hasConflict = hasExistingAvailability(
                    jour.value, 
                    bulkData[jour.value as keyof typeof bulkData].heure_debut
                  )
                  
                  return (
                    <div key={jour.value} className="space-y-2">
                      <div className={`flex items-center gap-4 p-3 border rounded-lg ${
                        hasConflict && bulkData[jour.value as keyof typeof bulkData].actif 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200'
                      }`}>
                        <label className="flex items-center gap-2 min-w-[100px]">
                          <input
                            type="checkbox"
                            checked={bulkData[jour.value as keyof typeof bulkData].actif}
                            onChange={(e) => setBulkData({
                              ...bulkData,
                              [jour.value]: {
                                ...bulkData[jour.value as keyof typeof bulkData],
                                actif: e.target.checked
                              }
                            })}
                          />
                          <span className="font-medium">{jour.label}</span>
                        </label>
                        
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={bulkData[jour.value as keyof typeof bulkData].heure_debut}
                            onChange={(e) => setBulkData({
                              ...bulkData,
                              [jour.value]: {
                                ...bulkData[jour.value as keyof typeof bulkData],
                                heure_debut: e.target.value
                              }
                            })}
                            disabled={!bulkData[jour.value as keyof typeof bulkData].actif}
                            className={`w-24 ${hasConflict && bulkData[jour.value as keyof typeof bulkData].actif ? 'border-red-300' : ''}`}
                          />
                          <span className="text-gray-500">à</span>
                          <Input
                            type="time"
                            value={bulkData[jour.value as keyof typeof bulkData].heure_fin}
                            onChange={(e) => setBulkData({
                              ...bulkData,
                              [jour.value]: {
                                ...bulkData[jour.value as keyof typeof bulkData],
                                heure_fin: e.target.value
                              }
                            })}
                            disabled={!bulkData[jour.value as keyof typeof bulkData].actif}
                            className="w-24"
                          />
                        </div>
                        
                        {hasConflict && bulkData[jour.value as keyof typeof bulkData].actif && (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      
                      {/* Afficher les disponibilités existantes */}
                      {existingAvailabilities.length > 0 && (
                        <div className="ml-4 text-xs text-gray-600">
                          <span className="font-medium">Créneaux existants:</span>
                          {existingAvailabilities.map((avail, index) => (
                            <span key={avail.id} className="ml-2">
                              {avail.heure_debut.substring(0, 5)}-{avail.heure_fin.substring(0, 5)}
                              {index < existingAvailabilities.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Avertissement de conflit */}
                      {hasConflict && bulkData[jour.value as keyof typeof bulkData].actif && (
                        <div className="ml-4 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Conflit détecté! Un créneau existe déjà à cette heure.</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBulkModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Créer le Planning
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