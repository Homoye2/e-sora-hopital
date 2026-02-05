import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  TrendingUp,
  Clock,
  CheckCircle,
  Building2
} from 'lucide-react'
import { 
  hopitalService, 
  specialisteService,
  rendezVousService,
  statistiquesService,
  authService,
  type User, 
  type Hopital,
  type Specialiste,
  type StatistiquesHopital
} from '../services/api'
import { formatDateTime } from '../lib/utils'

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null)
  const [hopital, setHopital] = useState<Hopital | null>(null)
  const [specialisteProfile, setSpecialisteProfile] = useState<Specialiste | null>(null)
  const [statistiques, setStatistiques] = useState<StatistiquesHopital | null>(null)
  const [prochainRendezVous, setProchainRendezVous] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      loadData(currentUser)
    }
  }, [])

  const loadData = async (currentUser: User) => {
    try {
      setLoading(true)
      
      // Charger l'hôpital selon le rôle
      if (currentUser.role === 'admin_hopital') {
        const hopitalData = await hopitalService.getMyHopital()
        setHopital(hopitalData)
        
        const stats = await statistiquesService.getHopital()
        setStatistiques(stats)
      } else if (currentUser.role === 'specialiste') {
        // Charger le profil spécialiste
        const specialisteData = await specialisteService.getMe()
        setSpecialisteProfile(specialisteData)
        
        // Récupérer l'hôpital depuis le profil spécialiste
        if (specialisteData.hopital) {
          const hopitalData = await hopitalService.getById(specialisteData.hopital)
          setHopital(hopitalData)
        }
        
        // Charger les statistiques du spécialiste
        const stats = await statistiquesService.getSpecialiste()
        setStatistiques(stats)
      }
      
      // Charger les prochains rendez-vous
      const rendezVousData = await rendezVousService.getAll({ 
        statut: 'confirme'
      })
      const rendezVousArray = Array.isArray(rendezVousData) ? rendezVousData : rendezVousData.results || []
      setProchainRendezVous(rendezVousArray.slice(0, 5))
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {user?.role === 'admin_hopital' 
              ? `Vue d'ensemble de ${hopital?.nom}` 
              : `Bonjour ${specialisteProfile?.titre} ${user?.nom}`
            }
          </p>
        </div>
        
        {hopital && (
          <Card className="w-full sm:w-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{hopital.nom}</h3>
                  <p className="text-sm text-gray-600">{hopital.ville}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'admin_hopital' ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spécialistes</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques?.total_specialistes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {statistiques?.specialistes_actifs || 0} actifs
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques?.total_rendez_vous || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {statistiques?.rendez_vous_en_attente || 0} en attente
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                <Stethoscope className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques?.total_consultations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {statistiques?.consultations_ce_mois || 0} ce mois
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmés</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques?.rendez_vous_confirmes || 0}</div>
                <p className="text-xs text-green-600">
                  Rendez-vous confirmés
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mes Rendez-vous</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques?.total_rendez_vous || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {statistiques?.rendez_vous_en_attente || 0} en attente
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                <Stethoscope className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques?.total_consultations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {statistiques?.consultations_ce_mois || 0} ce mois
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {specialisteProfile?.note_moyenne ? Number(specialisteProfile.note_moyenne).toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {specialisteProfile?.nombre_avis || 0} avis
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expérience</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {specialisteProfile?.annees_experience || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  années d'expérience
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Prochains rendez-vous */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prochains Rendez-vous
            </CardTitle>
            <CardDescription>
              Les rendez-vous confirmés à venir
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prochainRendezVous.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun rendez-vous confirmé
              </p>
            ) : (
              <div className="space-y-4">
                {prochainRendezVous.map((rdv) => (
                  <div key={rdv.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {rdv.patient_nom} {rdv.patient_prenom}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(rdv.datetime)}
                      </p>
                      {rdv.motif && (
                        <p className="text-xs text-gray-500 mt-1">
                          {rdv.motif}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Confirmé</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques par spécialité (pour admin) ou informations personnelles (pour spécialiste) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user?.role === 'admin_hopital' ? (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Statistiques par Spécialité
                </>
              ) : (
                <>
                  <Stethoscope className="h-5 w-5" />
                  Mon Profil
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.role === 'admin_hopital' ? (
              <div className="space-y-4">
                {statistiques?.par_specialite && Object.entries(statistiques.par_specialite).map(([specialite, stats]) => (
                  <div key={specialite} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{specialite}</p>
                      <p className="text-sm text-gray-600">
                        {stats.specialistes} spécialiste{stats.specialistes > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{stats.rendez_vous} RDV</p>
                      <p className="text-xs text-gray-500">{stats.consultations} consultations</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              specialisteProfile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-gray-600">Spécialité</span>
                    <span className="font-medium">{specialisteProfile.specialite_nom}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-gray-600">Numéro d'ordre</span>
                    <span className="font-medium">{specialisteProfile.numero_ordre}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-gray-600">Tarif consultation</span>
                    <span className="font-medium">{specialisteProfile.tarif_consultation} FCFA</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-gray-600">Durée consultation</span>
                    <span className="font-medium">{specialisteProfile.duree_consultation} min</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-gray-600">Nouveaux patients</span>
                    <span className={`font-medium ${specialisteProfile.accepte_nouveaux_patients ? 'text-green-600' : 'text-red-600'}`}>
                      {specialisteProfile.accepte_nouveaux_patients ? 'Acceptés' : 'Non acceptés'}
                    </span>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}