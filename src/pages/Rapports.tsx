import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  FileText, 
  Search,
  Eye,
  Send,
  Download,
  Calendar,
  User,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { 
  rapportService,
  consultationService,
  statistiquesService,
  authService,
  type RapportConsultation,
  type ConsultationPF,
  type User as UserType,
  type StatistiquesHopital,
  type StatistiquesSpecialiste
} from '../services/api'
import { formatDateTime, formatDate } from '../lib/utils'

export const Rapports = () => {
  const [rapports, setRapports] = useState<RapportConsultation[]>([])
  const [consultations, setConsultations] = useState<ConsultationPF[]>([])
  const [statistiques, setStatistiques] = useState<StatistiquesHopital | StatistiquesSpecialiste | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConsultation, setSelectedConsultation] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'rapports' | 'statistiques'>('rapports')

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
      
      // Charger les rapports
      const rapportsData = await rapportService.getAll()
      const rapportsArray = Array.isArray(rapportsData) ? rapportsData : rapportsData.results || []
      setRapports(rapportsArray)
      
      // Charger les consultations selon le rôle
      let consultationsData
      if (currentUser.role === 'admin_hopital') {
        consultationsData = await consultationService.getAll()
      } else if (currentUser.role === 'specialiste') {
        consultationsData = await consultationService.getMesConsultations()
      }
      
      const consultationsArray = Array.isArray(consultationsData) ? consultationsData : consultationsData.results || []
      setConsultations(consultationsArray)
      
      // Charger les statistiques
      if (currentUser.role === 'admin_hopital') {
        const stats = await statistiquesService.getHopital()
        setStatistiques(stats)
      } else if (currentUser.role === 'specialiste') {
        const stats = await statistiquesService.getSpecialiste()
        setStatistiques(stats)
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRapport = async (id: number) => {
    try {
      await rapportService.envoyerPatient(id)
      await loadData(user!)
      alert('Rapport envoyé au patient avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rapport:', error)
      alert('Erreur lors de l\'envoi du rapport')
    }
  }

  const filteredRapports = rapports.filter(rapport => {
    const matchesSearch = rapport.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rapport.contenu.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesConsultation = selectedConsultation === 'all' || selectedConsultation === '' || 
                               rapport.consultation.toString() === selectedConsultation
    
    const matchesStatus = selectedStatus === 'all' || selectedStatus === '' || 
                         (selectedStatus === 'envoye' && rapport.envoye_patient) ||
                         (selectedStatus === 'non_envoye' && !rapport.envoye_patient)
    
    return matchesSearch && matchesConsultation && matchesStatus
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
          <h1 className="text-3xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-600">
            {user?.role === 'admin_hopital' 
              ? 'Vue d\'ensemble des rapports et statistiques de l\'hôpital'
              : 'Mes rapports de consultation et statistiques'
            }
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('rapports')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'rapports'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Rapports de Consultation
        </button>
        <button
          onClick={() => setActiveTab('statistiques')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'statistiques'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Statistiques
        </button>
      </div>

      {activeTab === 'rapports' ? (
        <>
          {/* Statistiques rapides des rapports */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Rapports</p>
                    <p className="text-2xl font-bold">{rapports.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Envoyés</p>
                    <p className="text-2xl font-bold text-green-600">
                      {rapports.filter(r => r.envoye_patient).length}
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {rapports.filter(r => !r.envoye_patient).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ce mois</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {rapports.filter(r => {
                        const rapportDate = new Date(r.created_at)
                        const now = new Date()
                        return rapportDate.getMonth() === now.getMonth() && 
                               rapportDate.getFullYear() === now.getFullYear()
                      }).length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
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
                      placeholder="Rechercher dans les rapports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedConsultation} onValueChange={setSelectedConsultation}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Toutes les consultations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les consultations</SelectItem>
                    {consultations.map((consultation) => (
                      <SelectItem key={consultation.id} value={consultation.id.toString()}>
                        {consultation.patient_nom} {consultation.patient_prenom} - {formatDate(consultation.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="envoye">Envoyés</SelectItem>
                    <SelectItem value="non_envoye">Non envoyés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des rapports */}
          <Card>
            <CardHeader>
              <CardTitle>Rapports de Consultation ({filteredRapports.length})</CardTitle>
              <CardDescription>
                Liste des rapports médicaux avec possibilité d'envoi aux patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Consultation</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRapports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Aucun rapport trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRapports.map((rapport) => {
                        const consultation = consultations.find(c => c.id === rapport.consultation)
                        
                        return (
                          <TableRow key={rapport.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{rapport.titre}</p>
                                <p className="text-sm text-gray-500">
                                  {rapport.contenu.substring(0, 100)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {consultation && (
                                <div>
                                  <p className="font-medium">
                                    {consultation.patient_nom} {consultation.patient_prenom}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(consultation.date)}
                                  </p>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <p>{formatDate(rapport.created_at)}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(rapport.created_at).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={rapport.envoye_patient ? "default" : "secondary"}>
                                {rapport.envoye_patient ? 'Envoyé' : 'En attente'}
                              </Badge>
                              {rapport.envoye_patient && rapport.date_envoi && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Le {formatDateTime(rapport.date_envoi)}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Ouvrir le rapport dans une nouvelle fenêtre ou modal
                                    window.open(`data:text/html,<html><body><h1>${rapport.titre}</h1><pre>${rapport.contenu}</pre></body></html>`, '_blank')
                                  }}
                                  title="Voir le rapport"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Télécharger le rapport
                                    const element = document.createElement('a')
                                    const file = new Blob([rapport.contenu], { type: 'text/plain' })
                                    element.href = URL.createObjectURL(file)
                                    element.download = `${rapport.titre}.txt`
                                    document.body.appendChild(element)
                                    element.click()
                                    document.body.removeChild(element)
                                  }}
                                  title="Télécharger"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                
                                {!rapport.envoye_patient && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSendRapport(rapport.id)}
                                    className="text-green-600 hover:text-green-700"
                                    title="Envoyer au patient"
                                  >
                                    <Send className="h-4 w-4" />
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
        </>
      ) : (
        <>
          {/* Statistiques générales */}
          {statistiques && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {user?.role === 'admin_hopital' ? (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Spécialistes</p>
                            <p className="text-2xl font-bold">
                              {'total_specialistes' in statistiques ? statistiques.total_specialistes : 0}
                            </p>
                            <p className="text-xs text-green-600">
                              {'specialistes_actifs' in statistiques ? statistiques.specialistes_actifs : 0} actifs
                            </p>
                          </div>
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Rendez-vous</p>
                            <p className="text-2xl font-bold">
                              {'total_rendez_vous' in statistiques ? statistiques.total_rendez_vous : 
                               'nombre_rendez_vous' in statistiques ? statistiques.nombre_rendez_vous : 0}
                            </p>
                            <p className="text-xs text-orange-600">
                              {statistiques.rendez_vous_en_attente || 0} en attente
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
                            <p className="text-sm font-medium text-gray-600">Consultations</p>
                            <p className="text-2xl font-bold">
                              {'total_consultations' in statistiques ? statistiques.total_consultations :
                               'nombre_consultations' in statistiques ? statistiques.nombre_consultations : 0}
                            </p>
                            <p className="text-xs text-blue-600">
                              {'consultations_ce_mois' in statistiques ? statistiques.consultations_ce_mois : 0} ce mois
                            </p>
                          </div>
                          <Activity className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Confirmés</p>
                            <p className="text-2xl font-bold">
                              {'rendez_vous_confirmes' in statistiques ? statistiques.rendez_vous_confirmes : 0}
                            </p>
                            <p className="text-xs text-green-600">
                              Rendez-vous confirmés
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Mes Rendez-vous</p>
                            <p className="text-2xl font-bold">
                              {'nombre_rendez_vous' in statistiques ? statistiques.nombre_rendez_vous : 0}
                            </p>
                            <p className="text-xs text-orange-600">
                              {statistiques.rendez_vous_en_attente || 0} en attente
                            </p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Consultations</p>
                            <p className="text-2xl font-bold">
                              {'nombre_consultations' in statistiques ? statistiques.nombre_consultations : 0}
                            </p>
                            <p className="text-xs text-blue-600">
                              Total effectuées
                            </p>
                          </div>
                          <Activity className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Statistiques par spécialité (pour admin) */}
              {user?.role === 'admin_hopital' && 'par_specialite' in statistiques && statistiques.par_specialite && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Statistiques par Spécialité
                    </CardTitle>
                    <CardDescription>
                      Répartition des activités par spécialité médicale
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(statistiques.par_specialite).map(([specialite, stats]) => (
                        <div key={specialite} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{specialite}</h3>
                            <p className="text-sm text-gray-600">
                              {(stats as any).specialistes} spécialiste{(stats as any).specialistes > 1 ? 's' : ''}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-lg font-bold text-blue-600">{(stats as any).rendez_vous}</p>
                              <p className="text-xs text-gray-500">Rendez-vous</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{(stats as any).consultations}</p>
                              <p className="text-xs text-gray-500">Consultations</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Graphiques et analyses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution Mensuelle</CardTitle>
                    <CardDescription>
                      Tendances des consultations et rendez-vous
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Graphique d'évolution</p>
                        <p className="text-sm">(À implémenter avec une librairie de graphiques)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition des Activités</CardTitle>
                    <CardDescription>
                      Distribution des types de consultations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Graphique en secteurs</p>
                        <p className="text-sm">(À implémenter avec une librairie de graphiques)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}