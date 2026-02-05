import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { 
  Settings, 
  Building2, 
  User, 
  Lock,
  Save,
  Eye,
  EyeOff,
  MapPin,
  Navigation,
  Trash2
} from 'lucide-react'
import { 
  hopitalService,
  specialisteService,
  authService,
  type User as UserType,
  type Hopital
} from '../services/api'

export const Parametres = () => {
  const [user, setUser] = useState<UserType | null>(null)
  const [hopital, setHopital] = useState<Hopital | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'hopital' | 'profil' | 'securite'>('profil')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // États pour la géolocalisation
  const [gettingLocation, setGettingLocation] = useState(false)
  
  // Données de l'hôpital
  const [hopitalData, setHopitalData] = useState({
    nom: '',
    code_hopital: '',
    adresse: '',
    ville: '',
    pays: '',
    telephone: '',
    email: '',
    description: '',
    couleur_theme: '',
    latitude: '',
    longitude: '',
    horaires_ouverture: {
      lundi: '',
      mardi: '',
      mercredi: '',
      jeudi: '',
      vendredi: '',
      samedi: '',
      dimanche: ''
    }
  })
  
  // Données du profil utilisateur
  const [profilData, setProfilData] = useState({
    nom: '',
    email: ''
  })
  
  // Données de sécurité
  const [securiteData, setSecuriteData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setProfilData({
        nom: currentUser.nom,
        email: currentUser.email
      })
      
      // Définir l'onglet par défaut selon le rôle
      if (currentUser.role === 'specialiste') {
        setActiveTab('profil')
      } else {
        setActiveTab('hopital')
      }
      
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const currentUser = authService.getCurrentUser()
      if (!currentUser) return
      
      // Charger les données de l'hôpital selon le rôle
      if (currentUser.role === 'admin_hopital') {
        const hopitalData = await hopitalService.getMyHopital()
        setHopital(hopitalData)
        
        setHopitalData({
          nom: hopitalData.nom,
          code_hopital: hopitalData.code_hopital,
          adresse: hopitalData.adresse,
          ville: hopitalData.ville,
          pays: hopitalData.pays,
          telephone: hopitalData.telephone,
          email: hopitalData.email,
          description: hopitalData.description,
          couleur_theme: hopitalData.couleur_theme,
          latitude: hopitalData.latitude ? hopitalData.latitude.toString() : '',
          longitude: hopitalData.longitude ? hopitalData.longitude.toString() : '',
          horaires_ouverture: hopitalData.horaires_ouverture || {
            lundi: '',
            mardi: '',
            mercredi: '',
            jeudi: '',
            vendredi: '',
            samedi: '',
            dimanche: ''
          }
        })
      } else if (currentUser.role === 'specialiste') {
        // Pour les spécialistes, récupérer l'hôpital depuis leur profil (lecture seule)
        try {
          const specialisteData = await specialisteService.getMe()
          if (specialisteData.hopital) {
            const hopitalData = await hopitalService.getById(specialisteData.hopital)
            setHopital(hopitalData)
            
            setHopitalData({
              nom: hopitalData.nom,
              code_hopital: hopitalData.code_hopital,
              adresse: hopitalData.adresse,
              ville: hopitalData.ville,
              pays: hopitalData.pays,
              telephone: hopitalData.telephone,
              email: hopitalData.email,
              description: hopitalData.description,
              couleur_theme: hopitalData.couleur_theme,
              latitude: hopitalData.latitude ? hopitalData.latitude.toString() : '',
              longitude: hopitalData.longitude ? hopitalData.longitude.toString() : '',
              horaires_ouverture: hopitalData.horaires_ouverture || {
                lundi: '',
                mardi: '',
                mercredi: '',
                jeudi: '',
                vendredi: '',
                samedi: '',
                dimanche: ''
              }
            })
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'hôpital du spécialiste:', error)
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateHopital = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hopital || !user) return
    
    // Seuls les admin_hopital peuvent modifier les informations de l'hôpital
    if (user.role !== 'admin_hopital') {
      alert('Accès refusé: Seuls les administrateurs d\'hôpital peuvent modifier ces informations')
      return
    }
    
    // Valider les coordonnées si fournies
    if (hopitalData.latitude && (parseFloat(hopitalData.latitude) < -90 || parseFloat(hopitalData.latitude) > 90)) {
      alert('La latitude doit être comprise entre -90 et 90')
      return
    }
    
    if (hopitalData.longitude && (parseFloat(hopitalData.longitude) < -180 || parseFloat(hopitalData.longitude) > 180)) {
      alert('La longitude doit être comprise entre -180 et 180')
      return
    }
    
    try {
      const updateData = {
        ...hopitalData,
        latitude: hopitalData.latitude ? parseFloat(hopitalData.latitude) : undefined,
        longitude: hopitalData.longitude ? parseFloat(hopitalData.longitude) : undefined
      }
      
      await hopitalService.update(hopital.id, updateData)
      alert('Informations de l\'hôpital mises à jour avec succès')
      await loadData()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour des informations')
    }
  }

  // Fonctions de géolocalisation
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par ce navigateur')
      return
    }

    setGettingLocation(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      
      setHopitalData(prev => ({
        ...prev,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6)
      }))

      alert('Localisation obtenue avec succès !')
    } catch (error: any) {
      console.error('Erreur de géolocalisation:', error)
      let message = 'Erreur lors de l\'obtention de la localisation'
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permission de géolocalisation refusée'
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Position non disponible'
          break
        case error.TIMEOUT:
          message = 'Délai d\'attente dépassé'
          break
      }
      
      alert(message)
    } finally {
      setGettingLocation(false)
    }
  }

  const clearLocation = () => {
    setHopitalData(prev => ({
      ...prev,
      latitude: '',
      longitude: ''
    }))
    alert('Localisation supprimée')
  }

  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await authService.updateProfile(profilData)
      alert('Profil mis à jour avec succès')
      
      // Mettre à jour l'utilisateur local
      const updatedUser = { ...user!, ...profilData }
      setUser(updatedUser)
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      alert('Erreur lors de la mise à jour du profil')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (securiteData.newPassword !== securiteData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }
    
    if (securiteData.newPassword.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    
    try {
      await authService.changePassword(securiteData.currentPassword, securiteData.newPassword)
      alert('Mot de passe modifié avec succès')
      setSecuriteData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      alert('Erreur lors du changement de mot de passe')
    }
  }

  const joursSemine = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ]

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
            <Settings className="h-8 w-8" />
            Paramètres
          </h1>
          <p className="text-gray-600">
            Gérez les paramètres de votre hôpital et votre profil
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {user?.role === 'admin_hopital' && (
          <button
            onClick={() => setActiveTab('hopital')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'hopital'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Hôpital
          </button>
        )}
        
        {user?.role === 'specialiste' && (
          <button
            onClick={() => setActiveTab('hopital')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'hopital'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Mon Hôpital
          </button>
        )}
        
        <button
          onClick={() => setActiveTab('profil')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'profil'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="h-4 w-4 inline mr-2" />
          Mon Profil
        </button>
        
        <button
          onClick={() => setActiveTab('securite')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'securite'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lock className="h-4 w-4 inline mr-2" />
          Sécurité
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'hopital' && user?.role === 'admin_hopital' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'Hôpital</CardTitle>
              <CardDescription>
                Gérez les informations générales de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateHopital} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom de l'hôpital</Label>
                    <Input
                      id="nom"
                      value={hopitalData.nom}
                      onChange={(e) => setHopitalData({...hopitalData, nom: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="code_hopital">Code de l'hôpital</Label>
                    <Input
                      id="code_hopital"
                      value={hopitalData.code_hopital}
                      onChange={(e) => setHopitalData({...hopitalData, code_hopital: e.target.value})}
                      placeholder="Ex: HOP001"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="couleur_theme">Couleur du thème</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="couleur_theme"
                        type="color"
                        value={hopitalData.couleur_theme}
                        onChange={(e) => setHopitalData({...hopitalData, couleur_theme: e.target.value})}
                        className="w-16 h-10"
                      />
                      <Input
                        value={hopitalData.couleur_theme}
                        onChange={(e) => setHopitalData({...hopitalData, couleur_theme: e.target.value})}
                        placeholder="#0066CC"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={hopitalData.description}
                    onChange={(e) => setHopitalData({...hopitalData, description: e.target.value})}
                    rows={3}
                    placeholder="Description de l'hôpital..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ville">Ville</Label>
                    <Input
                      id="ville"
                      value={hopitalData.ville}
                      onChange={(e) => setHopitalData({...hopitalData, ville: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pays">Pays</Label>
                    <Input
                      id="pays"
                      value={hopitalData.pays}
                      onChange={(e) => setHopitalData({...hopitalData, pays: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={hopitalData.telephone}
                      onChange={(e) => setHopitalData({...hopitalData, telephone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={hopitalData.email}
                      onChange={(e) => setHopitalData({...hopitalData, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      value={hopitalData.adresse}
                      onChange={(e) => setHopitalData({...hopitalData, adresse: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Section Localisation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Localisation GPS</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={hopitalData.latitude}
                        onChange={(e) => setHopitalData({...hopitalData, latitude: e.target.value})}
                        placeholder="Ex: 14.6928"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={hopitalData.longitude}
                        onChange={(e) => setHopitalData({...hopitalData, longitude: e.target.value})}
                        placeholder="Ex: -17.4467"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="flex items-center gap-2"
                    >
                      <Navigation className={`h-4 w-4 ${gettingLocation ? 'animate-spin' : ''}`} />
                      {gettingLocation ? 'Localisation...' : 'Obtenir ma position'}
                    </Button>
                    
                    {(hopitalData.latitude || hopitalData.longitude) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearLocation}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                  
                  {(hopitalData.latitude && hopitalData.longitude) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Position: {hopitalData.latitude}, {hopitalData.longitude}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Cette localisation permettra aux patients de vous trouver plus facilement
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horaires d'Ouverture</CardTitle>
              <CardDescription>
                Définissez les horaires d'ouverture de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {joursSemine.map((jour) => (
                  <div key={jour.key} className="flex items-center gap-4">
                    <Label className="w-24 text-sm font-medium">{jour.label}</Label>
                    <Input
                      value={hopitalData.horaires_ouverture[jour.key as keyof typeof hopitalData.horaires_ouverture] || ''}
                      onChange={(e) => setHopitalData({
                        ...hopitalData,
                        horaires_ouverture: {
                          ...hopitalData.horaires_ouverture,
                          [jour.key]: e.target.value
                        }
                      })}
                      placeholder="Ex: 08:00 - 18:00 ou Fermé"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vue lecture seule pour les spécialistes */}
      {activeTab === 'hopital' && user?.role === 'specialiste' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'Hôpital</CardTitle>
              <CardDescription>
                Informations de votre établissement (lecture seule)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom de l'hôpital</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      {hopitalData.nom || 'Non renseigné'}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Ville</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      {hopitalData.ville || 'Non renseigné'}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Adresse</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      {hopitalData.adresse || 'Non renseigné'}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Téléphone</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      {hopitalData.telephone || 'Non renseigné'}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Email</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      {hopitalData.email || 'Non renseigné'}
                    </div>
                  </div>
                </div>
                
                {/* Localisation en lecture seule */}
                {(hopitalData.latitude && hopitalData.longitude) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">Localisation</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Latitude</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          {hopitalData.latitude}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Longitude</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          {hopitalData.longitude}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Position GPS configurée: {hopitalData.latitude}, {hopitalData.longitude}
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Description</Label>
                  <div className="p-2 bg-gray-50 rounded border min-h-[100px]">
                    {hopitalData.description || 'Aucune description'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'profil' && (
        <Card>
          <CardHeader>
            <CardTitle>Mon Profil</CardTitle>
            <CardDescription>
              Gérez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfil} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profil_nom">Nom complet</Label>
                  <Input
                    id="profil_nom"
                    value={profilData.nom}
                    onChange={(e) => setProfilData({...profilData, nom: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="profil_email">Email</Label>
                  <Input
                    id="profil_email"
                    type="email"
                    value={profilData.email}
                    onChange={(e) => setProfilData({...profilData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Rôle</Label>
                  <Input
                    value={user?.role === 'admin_hopital' ? 'Administrateur Hôpital' : 'Spécialiste'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label>Statut</Label>
                  <Input
                    value={user?.actif ? 'Actif' : 'Inactif'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Mettre à jour le profil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'securite' && (
        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>
              Modifiez votre mot de passe et gérez la sécurité de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="current_password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? 'text' : 'password'}
                    value={securiteData.currentPassword}
                    onChange={(e) => setSecuriteData({...securiteData, currentPassword: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={securiteData.newPassword}
                    onChange={(e) => setSecuriteData({...securiteData, newPassword: e.target.value})}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={securiteData.confirmPassword}
                  onChange={(e) => setSecuriteData({...securiteData, confirmPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Lock className="h-4 w-4 mr-2" />
                  Changer le mot de passe
                </Button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de sécurité</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connexion sécurisée (HTTPS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Authentification par token JWT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Données chiffrées en base</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}